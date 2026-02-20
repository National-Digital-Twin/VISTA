"""Views for scenario-scoped exposure layer operations."""

import json

from django.db import connection
from django.db.models import Case, CharField, F, Prefetch, Q, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType
from api.permissions import Administrator
from api.serializers import ExposureLayerCreateSerializer, ExposureLayerUpdateSerializer
from api.utils.auth import get_user_id_from_request
from api.utils.geometry import buffer_geometry


class ScenarioExposureLayersView(viewsets.ViewSet):
    """View for listing and managing exposure layers for a scenario."""

    def get_permissions(self):
        """Get permissions for action within viewset."""
        if self.action in ["approve", "reject", "remove"]:
            return [Administrator()]
        return super().get_permissions()

    def list(self, request, scenario_id):
        """List all exposure layer types with nested exposure layers.

        Each exposure layer includes:
        - isActive: visibility toggle for the user
        - focusAreaRelation: spatial relationship with focus area
          ("contained", "overlaps", "elsewhere", or null if no focus_area_id)

        All exposure layers are returned regardless of spatial relationship.

        Query params:
            focus_area_id: Optional UUID. If provided, returns layers scoped to that
                focus area with focusAreaRelation calculated. If not provided, returns
                layers for all active focus areas with focusAreaRelation as null.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)
        focus_area_id = request.query_params.get("focus_area_id")

        if focus_area_id:
            return self._get_for_focus_area(scenario, user_id, focus_area_id)
        return self._get_for_all_active_focus_areas(scenario, user_id)

    def _get_for_focus_area(self, scenario, user_id, focus_area_id):
        """Get exposure layers scoped to a specific focus area.

        Returns all layers with focusAreaRelation indicating spatial relationship.
        isActive is set based on whether the layer is enabled for this focus area.
        """
        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        visible_exposure_layer_ids = set(
            VisibleExposureLayer.objects.filter(focus_area=focus_area).values_list(
                "exposure_layer_id", flat=True
            )
        )

        return self._build_response(
            visible_exposure_layer_ids,
            user_id,
            scenario,
            focus_area=focus_area,
        )

    def _get_for_all_active_focus_areas(self, scenario, user_id):
        """Get exposure layers visible in any active focus area.

        Returns all layers with focusAreaRelation as null (not calculated).
        isActive is set based on visibility in any active focus area.
        """
        focus_area_ids = list(
            FocusArea.objects.filter(
                scenario=scenario,
                user_id=user_id,
                is_active=True,
            ).values_list("id", flat=True)
        )

        if not focus_area_ids:
            return self._build_response(set(), user_id, scenario)

        all_visible_ids = set(
            VisibleExposureLayer.objects.filter(focus_area_id__in=focus_area_ids).values_list(
                "exposure_layer_id", flat=True
            )
        )

        return self._build_response(all_visible_ids, user_id, scenario)

    def _build_response(
        self,
        visible_exposure_layer_ids,
        user_id,
        scenario,
        focus_area=None,
    ):
        """Build the response with exposure layer types and their layers.

        Args:
            visible_exposure_layer_ids: Set of layer IDs that are visible
            user_id: Current user's ID
            scenario: The scenario object
            focus_area: Optional focus area. If provided, spatial relation is calculated.
        """
        accessible_layers_filter = (
            Q(user_id__isnull=True)  # System layers
            | Q(user_id=user_id, scenario=scenario)  # User layers
            | Q(scenario=scenario, status=ExposureLayer.APPROVED)  # Approved layers
        )
        exposure_layers_qs = ExposureLayer.objects.filter(accessible_layers_filter)
        exposure_layers_qs = exposure_layers_qs.order_by(F("created_at").asc(nulls_first=True))

        if focus_area and focus_area.geometry:
            fa_geom = focus_area.geometry
            exposure_layers_qs = exposure_layers_qs.annotate(
                focus_area_relation=Case(
                    When(geometry__contained=fa_geom, then=Value("contained")),
                    When(geometry__intersects=fa_geom, then=Value("overlaps")),
                    default=Value("elsewhere"),
                    output_field=CharField(),
                )
            )
        elif focus_area and focus_area.geometry is None:
            exposure_layers_qs = exposure_layers_qs.annotate(
                focus_area_relation=Value("contained", output_field=CharField())
            )

        exposure_layer_types = ExposureLayerType.objects.prefetch_related(
            Prefetch("exposure_layers", queryset=exposure_layers_qs)
        )

        result = []
        for exposure_layer_type in exposure_layer_types:
            layers_data = []
            for exposure_layer in exposure_layer_type.exposure_layers.all():
                layer_data = self._build_layer_data_response(
                    exposure_layer, visible_exposure_layer_ids, exposure_layer_type
                )
                layers_data.append(layer_data)

            result.append(
                {
                    "id": str(exposure_layer_type.id),
                    "name": exposure_layer_type.name,
                    "isUserEditable": exposure_layer_type.is_user_editable,
                    "exposureLayers": layers_data,
                }
            )

        return Response(result)

    def _build_layer_data_response(
        self, exposure_layer, visible_exposure_layer_ids, exposure_layer_type
    ):
        return {
            "id": str(exposure_layer.id),
            "name": exposure_layer.name,
            "isActive": exposure_layer.id in visible_exposure_layer_ids,
            "isUserDefined": exposure_layer.is_user_defined,
            "focusAreaRelation": getattr(exposure_layer, "focus_area_relation", None),
            "geometry": (
                json.loads(exposure_layer.geometry.json) if exposure_layer.geometry else None
            ),
            "status": exposure_layer.status if exposure_layer_type.is_user_editable else None,
            "createdAt": (
                exposure_layer.created_at.isoformat() if exposure_layer.created_at else None
            ),
        }

    def create(self, request, scenario_id):
        """Create a new user-drawn exposure layer.

        Request body:
            type_id: UUID of the exposure layer type (required, must be user-editable)
            geometry: GeoJSON geometry (required)
            name: Optional name (auto-generated if not provided)
            focus_area_id: Optional focus area ID to auto-enable visibility
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        serializer = ExposureLayerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        type_id = serializer.validated_data["type_id"]
        exposure_layer_type = ExposureLayerType.objects.filter(id=type_id).first()
        if not exposure_layer_type:
            return Response(
                {"error": "Exposure layer type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not exposure_layer_type.is_user_editable:
            return Response(
                {"error": "Cannot create layers for this type"},
                status=status.HTTP_403_FORBIDDEN,
            )

        geom = serializer.validated_data["geometry"]
        name = serializer.validated_data.get("name")
        if not name:
            existing_count = ExposureLayer.objects.filter(
                user_id=user_id, scenario_id=scenario_id
            ).count()
            name = f"Exposure {existing_count + 1}"

        exposure_layer = ExposureLayer.objects.create(
            name=name,
            geometry=geom,
            geometry_buffered=buffer_geometry(connection, geom),
            type=exposure_layer_type,
            user_id=user_id,
            scenario=scenario,
        )

        focus_area_id = serializer.validated_data.get("focus_area_id")
        if focus_area_id:
            focus_area = FocusArea.objects.filter(
                id=focus_area_id, scenario=scenario, user_id=user_id
            ).first()
            if focus_area:
                VisibleExposureLayer.objects.get_or_create(
                    focus_area=focus_area,
                    exposure_layer=exposure_layer,
                )

        return Response(
            {
                "id": str(exposure_layer.id),
                "name": exposure_layer.name,
                "geometry": json.loads(exposure_layer.geometry.json),
                "isActive": focus_area_id is not None,
                "isUserDefined": True,
                "status": exposure_layer.status if exposure_layer_type.is_user_editable else None,
                "createdAt": exposure_layer.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, scenario_id, exposure_layer_id):
        """Update a user-drawn exposure layer (rename or update geometry).

        Request body:
            name: Optional new name
            geometry: Optional new GeoJSON geometry
        """
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            user_id=user_id,
            scenario=scenario,
        )

        if not exposure_layer.is_editable:
            return Response(
                {"error": "Cannot edit this layer"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ExposureLayerUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if "name" in serializer.validated_data:
            exposure_layer.name = serializer.validated_data["name"]

        if "geometry" in serializer.validated_data:
            geom = serializer.validated_data["geometry"]
            exposure_layer.geometry = geom
            exposure_layer.geometry_buffered = buffer_geometry(connection, geom)

        exposure_layer.save()

        return Response(
            {
                "id": str(exposure_layer.id),
                "name": exposure_layer.name,
                "geometry": json.loads(exposure_layer.geometry.json),
                "isUserDefined": True,
                "createdAt": (
                    exposure_layer.created_at.isoformat() if exposure_layer.created_at else None
                ),
            }
        )

    def destroy(self, request, scenario_id, exposure_layer_id):
        """Delete a user-drawn exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            user_id=user_id,
            scenario=scenario,
        )

        if not exposure_layer.is_editable:
            return Response(
                {"error": "Cannot delete this layer"},
                status=status.HTTP_403_FORBIDDEN,
            )

        exposure_layer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, scenario_id, exposure_layer_id):
        """Publish editable exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            user_id=user_id,
            scenario=scenario,
        )

        if not exposure_layer.is_editable:
            return Response(
                {"error": "Cannot publish a non-editable layer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exposure_layer.status = ExposureLayer.PENDING
        exposure_layer.save()
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, scenario_id, exposure_layer_id):
        """Approve editable exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            scenario=scenario,
        )

        if not exposure_layer.is_ready_for_admin_review:
            return Response(
                {"error": "Cannot approve a non-editable layer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exposure_layer.status = ExposureLayer.APPROVED
        exposure_layer.approved_by = user_id
        exposure_layer.save()
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, scenario_id, exposure_layer_id):
        """Reject editable exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            scenario=scenario,
        )

        if not exposure_layer.is_ready_for_admin_review:
            return Response(
                {"error": "Cannot reject a non-editable layer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exposure_layer.status = ExposureLayer.UNPUBLISHED
        exposure_layer.rejected_by = user_id
        exposure_layer.save()
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="remove")
    def remove(self, request, scenario_id, exposure_layer_id):
        """Remove editable exposure layer."""
        scenario = get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)

        exposure_layer = get_object_or_404(
            ExposureLayer,
            id=exposure_layer_id,
            scenario=scenario,
        )

        if not exposure_layer.is_ready_for_admin_removal:
            return Response(
                {"error": "Cannot remove a non-editable layer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exposure_layer.status = ExposureLayer.UNPUBLISHED
        exposure_layer.removed_by = user_id
        exposure_layer.save()
        return Response(status=status.HTTP_200_OK)
