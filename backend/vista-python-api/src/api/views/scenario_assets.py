"""Views for scenario-scoped asset operations."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset import Asset
from api.models.asset_type import AssetCategory
from api.serializers import ScenarioAssetSerializer
from api.utils.auth import get_user_id_from_request


class ScenarioAssetTypesView(APIView):
    """View for listing asset types with visibility status for a scenario."""

    def get(self, request, scenario_id):
        """List all asset categories with nested subcategories and asset types.

        Each asset type includes isActive indicating visibility for the user.

        Query params:
            focus_area_id: Optional UUID. If provided, returns visibility status
                for that specific focus area. If omitted, returns map-wide
                (global) visibility status where focus_area is NULL.
        """
        get_object_or_404(Scenario, id=scenario_id)

        focus_area_id = request.query_params.get("focus_area_id")
        user_id = get_user_id_from_request(request)

        visible_query = VisibleAsset.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
        )

        if focus_area_id:
            visible_query = visible_query.filter(focus_area_id=focus_area_id)
        else:
            visible_query = visible_query.filter(focus_area__isnull=True)

        visible_asset_type_ids = set(visible_query.values_list("asset_type_id", flat=True))

        categories = AssetCategory.objects.prefetch_related("sub_categories__asset_types").all()

        result = [
            {
                "id": str(category.id),
                "name": category.name,
                "subCategories": [
                    {
                        "id": str(sub_category.id),
                        "name": sub_category.name,
                        "assetTypes": [
                            {
                                "id": str(asset_type.id),
                                "name": asset_type.name,
                                "isActive": asset_type.id in visible_asset_type_ids,
                            }
                            for asset_type in sub_category.asset_types.all()
                        ],
                    }
                    for sub_category in category.sub_categories.all()
                ],
            }
            for category in categories
        ]

        return Response(result)


class ScenarioAssetsView(APIView):
    """View for listing assets filtered by scenario visibility settings."""

    def get(self, request, scenario_id):
        """List assets visible in the scenario for the current user.

        Returns assets where:
        - The asset type has map-wide visibility enabled, OR
        - The asset is within an active focus area that has visibility
          enabled for that asset type.

        Query params:
            exclude_map_wide: If "true", excludes assets from map-wide visibility
                and only returns assets within active focus areas.
        """
        get_object_or_404(Scenario, id=scenario_id)

        user_id = get_user_id_from_request(request)
        exclude_map_wide = request.query_params.get("exclude_map_wide", "").lower() == "true"

        all_visible = VisibleAsset.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
        ).values_list("asset_type_id", "focus_area_id")

        map_wide_type_ids = set()
        focus_area_type_ids = {}
        for asset_type_id, focus_area_id in all_visible:
            if focus_area_id is None:
                map_wide_type_ids.add(asset_type_id)
            else:
                if focus_area_id not in focus_area_type_ids:
                    focus_area_type_ids[focus_area_id] = set()
                focus_area_type_ids[focus_area_id].add(asset_type_id)

        active_focus_areas = FocusArea.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_active=True,
        )

        focus_area_filter = Q()
        for focus_area in active_focus_areas:
            visible_types = focus_area_type_ids.get(focus_area.id, set())
            if visible_types:
                focus_area_filter |= Q(
                    geom__within=focus_area.geometry,
                    type_id__in=visible_types,
                )

        if exclude_map_wide:
            combined_filter = focus_area_filter
        elif map_wide_type_ids:
            combined_filter = Q(type_id__in=map_wide_type_ids) | focus_area_filter
        else:
            combined_filter = focus_area_filter

        if not combined_filter:
            return Response([])

        assets = Asset.objects.filter(combined_filter).select_related("type").distinct()
        serializer = ScenarioAssetSerializer(assets, many=True)
        return Response(serializer.data)
