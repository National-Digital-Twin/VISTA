"""Views for scenario-scoped resource intervention operations."""

import csv
import io
import logging

from django.db import transaction
from django.db.models import Prefetch
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Scenario, VisibleResourceInterventionType
from api.models.resource_intervention import (
    ResourceInterventionAction,
    ResourceInterventionLocation,
    ResourceInterventionType,
)
from api.repository.external.idp_repository import IdpRepository
from api.serializers import (
    ExportParamsSerializer,
    PaginationParamsSerializer,
    ResourceInterventionActionLogSerializer,
    ResourceInterventionActionSerializer,
    ResourceInterventionLocationSerializer,
    ResourceInterventionStockActionResponseSerializer,
    ResourceInterventionTypeWithLocationsSerializer,
)
from api.utils.auth import get_user_id_from_request

logger = logging.getLogger(__name__)


def _build_user_name_map():
    """Build a user_id -> name mapping from the identity provider."""
    try:
        idp = IdpRepository()
        users = idp.list_users_in_group()
        return {user.id: user.name for user in users}
    except Exception:
        logger.exception("Failed to fetch users from identity provider")
        return {}


class ScenarioResourceInterventionsView(APIView):
    """View for listing resource intervention types with nested locations."""

    def get(self, request, scenario_id):
        """List all resource intervention types with nested locations."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        resource_types = ResourceInterventionType.objects.prefetch_related(
            Prefetch(
                "locations",
                queryset=ResourceInterventionLocation.objects.filter(
                    scenario_id=scenario_id
                ).order_by("name"),
            ),
        )

        visible_type_ids = set(
            VisibleResourceInterventionType.objects.filter(
                user_id=user_id,
                scenario=scenario,
            ).values_list("resource_intervention_type_id", flat=True)
        )

        result = [
            {
                "id": resource_type.id,
                "name": resource_type.name,
                "unit": resource_type.unit,
                "is_active": resource_type.id in visible_type_ids,
                "locations": resource_type.locations.all(),
            }
            for resource_type in resource_types
        ]

        serializer = ResourceInterventionTypeWithLocationsSerializer(result, many=True)
        return Response(serializer.data)


class ScenarioResourceInterventionLocationView(APIView):
    """View for retrieving and acting on a single resource intervention location."""

    def get(self, request, scenario_id, location_id):  # noqa: ARG002
        """Retrieve single location details."""
        get_object_or_404(Scenario, id=scenario_id)

        location = get_object_or_404(
            ResourceInterventionLocation,
            id=location_id,
            scenario_id=scenario_id,
        )

        serializer = ResourceInterventionLocationSerializer(location)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request, scenario_id, location_id, action_type):
        """Withdraw or restock a location."""
        if action_type not in ("withdraw", "restock"):
            return Response(
                {"error": f"Invalid action type: {action_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        location = get_object_or_404(
            ResourceInterventionLocation.objects.select_for_update(),
            id=location_id,
            scenario_id=scenario_id,
        )

        serializer = ResourceInterventionActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]

        if action_type == "withdraw":
            if quantity > location.current_stock:
                return Response(
                    {
                        "error": f"Insufficient stock. Available: {location.current_stock}, "
                        f"requested: {quantity}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            location.current_stock -= quantity
        else:
            if location.current_stock + quantity > location.max_capacity:
                return Response(
                    {
                        "error": f"Exceeds capacity. Current: {location.current_stock}, "
                        f"max: {location.max_capacity}, requested: {quantity}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            location.current_stock += quantity

        location.save(update_fields=["current_stock", "updated_at"])

        ResourceInterventionAction.objects.create(
            location=location,
            user_id=user_id,
            action_type=action_type,
            quantity=quantity,
        )

        response_serializer = ResourceInterventionStockActionResponseSerializer(
            {
                "id": location.id,
                "current_stock": location.current_stock,
                "max_capacity": location.max_capacity,
                "action": action_type,
                "quantity": quantity,
            }
        )
        return Response(response_serializer.data)


class ScenarioResourceInterventionActionsView(APIView):
    """View for listing resource intervention actions (usage log)."""

    def get(self, request, scenario_id):
        """List actions for scenario, paginated by cursor.

        Query params:
            cursor: ISO datetime to fetch actions before
            limit: page size (default 50, max 100)
        """
        get_object_or_404(Scenario, id=scenario_id)

        params_serializer = PaginationParamsSerializer(data=request.query_params)
        params_serializer.is_valid(raise_exception=True)
        limit = params_serializer.validated_data["limit"]
        cursor = params_serializer.validated_data.get("cursor")
        type_id = params_serializer.validated_data.get("type_id")

        base_qs = ResourceInterventionAction.objects.filter(
            location__scenario_id=scenario_id,
        )

        if type_id:
            base_qs = base_qs.filter(location__type_id=type_id)
        total_count = base_qs.count()

        actions_qs = base_qs.select_related("location", "location__type").order_by("-created_at")

        if cursor:
            actions_qs = actions_qs.filter(created_at__lt=cursor)

        actions = list(actions_qs[: limit + 1])
        has_next = len(actions) > limit
        actions = actions[:limit]

        user_name_map = _build_user_name_map()
        serializer = ResourceInterventionActionLogSerializer(
            actions, many=True, context={"user_name_map": user_name_map}
        )

        response_data = {
            "total_count": total_count,
            "results": serializer.data,
            "next_cursor": actions[-1].created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            if has_next
            else None,
        }
        return Response(response_data)


class ScenarioResourceInterventionActionsExportView(APIView):
    """Export resource intervention actions as CSV."""

    def get(self, request, scenario_id):
        """Stream all actions for a scenario and resource type as CSV."""
        get_object_or_404(Scenario, id=scenario_id)

        params_serializer = ExportParamsSerializer(data=request.query_params)
        params_serializer.is_valid(raise_exception=True)
        type_id = params_serializer.validated_data["type_id"]

        resource_type = get_object_or_404(ResourceInterventionType, id=type_id)

        actions_qs = (
            ResourceInterventionAction.objects.filter(
                location__scenario_id=scenario_id,
                location__type_id=type_id,
            )
            .select_related("location", "location__type")
            .order_by("-created_at")
        )

        user_name_map = _build_user_name_map()

        filename = f"{resource_type.name}-actions-export.csv"
        response = StreamingHttpResponse(
            self._csv_rows(actions_qs.iterator(), user_name_map),
            content_type="text/csv",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _csv_rows(self, actions_iterator, user_name_map):
        """Generate CSV rows from actions queryset iterator."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        writer.writerow(["Time", "Location", "Resource Type", "Action", "Quantity", "User"])
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)

        for action in actions_iterator:
            user_id = str(action.user_id)
            writer.writerow(
                [
                    action.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    action.location.name,
                    action.location.type.name,
                    action.action_type.title(),
                    action.quantity,
                    user_name_map.get(user_id) or user_id,
                ]
            )
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)
