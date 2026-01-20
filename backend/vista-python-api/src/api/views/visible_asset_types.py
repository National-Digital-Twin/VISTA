"""Views for asset type visibility toggling."""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import (
    AssetScoreFilter,
    AssetSubCategory,
    AssetType,
    FocusArea,
    Scenario,
    VisibleAsset,
)
from api.serializers import (
    BulkVisibleAssetTypeResponseSerializer,
    BulkVisibleAssetTypeToggleSerializer,
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

        Requires focus_area_id to specify which focus area to toggle visibility for.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = VisibleAssetTypeToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        asset_type_id = serializer.validated_data["asset_type_id"]
        focus_area_id = serializer.validated_data["focus_area_id"]
        is_active = serializer.validated_data["is_active"]

        asset_type = get_object_or_404(AssetType, id=asset_type_id)
        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        if is_active:
            VisibleAsset.objects.get_or_create(
                focus_area=focus_area,
                asset_type=asset_type,
            )
        else:
            VisibleAsset.objects.filter(
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
        """Clear all visibility settings for a focus area.

        Requires focus_area_id query param to specify which focus area to clear.
        """
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        focus_area_id = request.query_params.get("focus_area_id")
        if not focus_area_id:
            return Response(
                {"detail": "focus_area_id query param is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        VisibleAsset.objects.filter(focus_area=focus_area).delete()
        AssetScoreFilter.objects.filter(focus_area=focus_area, asset_type__isnull=False).delete()

        return Response({"success": True}, status=status.HTTP_200_OK)


class BulkVisibleAssetTypeView(APIView):
    """View for bulk toggling asset type visibility by subcategory."""

    def put(self, request, scenario_id=None):
        """Bulk enable or disable visibility for all asset types in a subcategory."""
        scenario = get_object_or_404(Scenario, id=scenario_id, is_active=True)
        user_id = get_user_id_from_request(request)

        serializer = BulkVisibleAssetTypeToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sub_category_id = serializer.validated_data["sub_category_id"]
        focus_area_id = serializer.validated_data["focus_area_id"]
        is_active = serializer.validated_data["is_active"]

        sub_category = get_object_or_404(AssetSubCategory, id=sub_category_id)

        focus_area = get_object_or_404(
            FocusArea, id=focus_area_id, scenario=scenario, user_id=user_id
        )

        asset_types = AssetType.objects.filter(sub_category=sub_category)

        with transaction.atomic():
            if is_active:
                for asset_type in asset_types:
                    VisibleAsset.objects.get_or_create(
                        focus_area=focus_area,
                        asset_type=asset_type,
                    )
            else:
                VisibleAsset.objects.filter(
                    focus_area=focus_area,
                    asset_type__in=asset_types,
                ).delete()

        response_serializer = BulkVisibleAssetTypeResponseSerializer(
            data={
                "sub_category_id": sub_category_id,
                "focus_area_id": focus_area_id,
                "is_active": is_active,
            }
        )
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
