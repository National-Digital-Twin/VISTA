"""Views for scenario-scoped asset operations."""

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset import Asset
from api.models.asset_type import AssetType
from api.serializers import ScenarioAssetSerializer
from api.utils.auth import get_user_id_from_request


class ScenarioAssetTypesView(APIView):
    """View for listing asset types with visibility status for a scenario."""

    def get(self, request, scenario_id):
        """List asset categories with nested subcategories and asset types.

        Each asset type includes isActive indicating visibility for the user.

        When focus_area_id is provided, only returns asset types that have at
        least one asset within that focus area's bounds. When omitted (map-wide),
        returns all asset types.

        Query params:
            focus_area_id: Optional UUID. If provided, returns visibility status
                for that specific focus area and filters to only asset types
                with assets in that area. If omitted, returns map-wide
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

        asset_types_query = AssetType.objects.select_related(
            "sub_category_id__category_id", "data_source_id"
        )

        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea, id=focus_area_id, scenario_id=scenario_id, user_id=user_id
            )
            # Filter to only asset types that have at least one asset in the focus area
            # and count only assets within the focus area
            asset_types_query = asset_types_query.annotate(
                asset_count=Count(
                    "assets", filter=Q(assets__geom__within=focus_area.geometry), distinct=True
                )
            ).filter(asset_count__gt=0)
        else:
            # Map-wide: count all assets per type
            asset_types_query = asset_types_query.annotate(
                asset_count=Count("assets", distinct=True)
            )

        asset_types = asset_types_query.order_by(
            "sub_category_id__category_id__name", "sub_category_id__name", "name"
        )

        categories_dict = {}
        for asset_type in asset_types:
            sub_cat = asset_type.sub_category_id
            cat = sub_cat.category_id
            datasource_id = asset_type.data_source_id_id

            if cat.id not in categories_dict:
                categories_dict[cat.id] = {
                    "id": str(cat.id),
                    "name": cat.name,
                    "subCategories": {},
                }

            cat_data = categories_dict[cat.id]
            if sub_cat.id not in cat_data["subCategories"]:
                cat_data["subCategories"][sub_cat.id] = {
                    "id": str(sub_cat.id),
                    "name": sub_cat.name,
                    "assetTypes": [],
                }

            cat_data["subCategories"][sub_cat.id]["assetTypes"].append(
                {
                    "id": str(asset_type.id),
                    "name": asset_type.name,
                    "assetCount": asset_type.asset_count,
                    "isActive": asset_type.id in visible_asset_type_ids,
                    "datasourceId": str(datasource_id) if datasource_id else None,
                }
            )

        result = [
            {
                "id": cat_data["id"],
                "name": cat_data["name"],
                "subCategories": list(cat_data["subCategories"].values()),
            }
            for cat_data in categories_dict.values()
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
