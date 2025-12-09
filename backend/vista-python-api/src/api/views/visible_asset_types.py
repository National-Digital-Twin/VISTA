"""Views for asset type visibility toggling."""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import AssetType, FocusArea, Scenario, VisibleAsset
from api.serializers import (
    VisibleAssetTypeResponseSerializer,
    VisibleAssetTypeToggleSerializer,
)
from api.utils.auth import get_user_id_from_request


class VisibleAssetTypeView(APIView):
    """View for toggling asset type visibility."""

    def put(self, request, scenario_id=None):
        """Enable or disable visibility for an asset type.

        When is_active is true, creates a VisibleAsset record.
        When is_active is false, deletes the VisibleAsset record.

        If focus_area_id is provided, toggles visibility for that specific
        focus area. Otherwise, toggles map-wide visibility.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = VisibleAssetTypeToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        asset_type_id = serializer.validated_data["asset_type_id"]
        focus_area_id = serializer.validated_data.get("focus_area_id")
        is_active = serializer.validated_data["is_active"]

        asset_type = get_object_or_404(AssetType, id=asset_type_id)

        focus_area = None
        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
            )

        if is_active:
            VisibleAsset.objects.get_or_create(
                scenario=scenario,
                user_id=user_id,
                focus_area=focus_area,
                asset_type=asset_type,
            )
        else:
            VisibleAsset.objects.filter(
                scenario=scenario,
                user_id=user_id,
                focus_area=focus_area,
                asset_type=asset_type,
            ).delete()

        response_data = {
            "asset_type_id": asset_type_id,
            "focus_area_id": focus_area_id,
            "is_active": is_active,
        }
        response_serializer = VisibleAssetTypeResponseSerializer(data=response_data)
        response_serializer.is_valid()
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, scenario_id=None):
        """Clear all visibility settings for a focus area or map-wide.

        If focus_area_id query param is provided, clears visibility for that
        specific focus area. Otherwise, clears map-wide visibility.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area_id = request.query_params.get("focus_area_id")

        query = VisibleAsset.objects.filter(
            scenario=scenario,
            user_id=user_id,
        )

        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
            )
            query = query.filter(focus_area=focus_area)
        else:
            query = query.filter(focus_area__isnull=True)

        query.delete()

        return Response({"success": True}, status=status.HTTP_200_OK)
