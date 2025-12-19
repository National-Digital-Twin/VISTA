"""Views for asset score filter operations."""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import AssetScoreFilter, AssetType, FocusArea, Scenario
from api.serializers import AssetScoreFilterCreateUpdateSerializer, AssetScoreFilterSerializer
from api.utils.auth import get_user_id_from_request


class AssetScoreFiltersView(APIView):
    """View for listing, creating, updating, and deleting asset score filters."""

    def get(self, request, scenario_id):
        """List all score filters for the user in this scenario."""
        get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        filters = AssetScoreFilter.objects.filter(
            focus_area__scenario_id=scenario_id,
            focus_area__user_id=user_id,
        ).select_related("focus_area", "asset_type")

        return Response(AssetScoreFilterSerializer(filters, many=True).data)

    def put(self, request, scenario_id):
        """Create or update a score filter."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = AssetScoreFilterCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        focus_area_id = serializer.validated_data["focus_area_id"]
        asset_type_id = serializer.validated_data.get("asset_type_id")

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        asset_type = None
        if asset_type_id:
            asset_type = get_object_or_404(AssetType, id=asset_type_id)

        defaults = {
            "criticality_values": serializer.validated_data.get("criticality_values"),
            "exposure_values": serializer.validated_data.get("exposure_values"),
            "redundancy_values": serializer.validated_data.get("redundancy_values"),
            "dependency_min": serializer.validated_data.get("dependency_min"),
            "dependency_max": serializer.validated_data.get("dependency_max"),
        }

        score_filter, created = AssetScoreFilter.objects.update_or_create(
            focus_area=focus_area,
            asset_type=asset_type,
            defaults=defaults,
        )

        return Response(
            AssetScoreFilterSerializer(score_filter).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, scenario_id):
        """Delete a score filter."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area_id = request.query_params.get("focus_area_id")
        asset_type_id = request.query_params.get("asset_type_id")

        if not focus_area_id:
            return Response(
                {"detail": "focus_area_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        query = AssetScoreFilter.objects.filter(focus_area=focus_area)

        if asset_type_id:
            query = query.filter(asset_type_id=asset_type_id)
        else:
            query = query.filter(asset_type__isnull=True)

        query.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
