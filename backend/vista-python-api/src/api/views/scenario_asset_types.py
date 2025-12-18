"""View for listing asset types with visibility and counts for a scenario."""

from uuid import UUID

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.filters import AssetFilterBuilder, FilterContext
from api.filters.asset_filter import has_criteria
from api.models import AssetScoreFilter, FocusArea, Scenario, VisibleAsset
from api.models.asset import Asset
from api.models.asset_type import AssetType
from api.utils.auth import get_user_id_from_request


def _get_focus_area_score_filters(focus_area_id) -> dict[UUID, AssetScoreFilter]:
    """Fetch score filters for a focus area, keyed by asset_type_id."""
    filters = AssetScoreFilter.objects.filter(focus_area_id=focus_area_id)
    return {sf.asset_type_id: sf for sf in filters}


def _compute_filtered_counts(
    builder, type_ids_with_filters: set[UUID], geometry
) -> dict[UUID, int]:
    """Compute filtered asset counts for types with score filters."""
    if not type_ids_with_filters:
        return {}

    combined_q = Q()
    for type_id in type_ids_with_filters:
        combined_q |= builder.type_filter(type_id, geometry)

    counts = Asset.objects.filter(combined_q).values("type_id").annotate(count=Count("id"))
    return {row["type_id"]: row["count"] for row in counts}


def _build_categories_response(asset_types, visible_type_ids, builder, focus_area):
    """Build hierarchical category/subcategory/asset-type response."""
    geometry = focus_area.geometry if focus_area else None

    type_ids_with_filters = {
        at.id for at in asset_types if has_criteria(builder.ctx.type_filters.get(at.id))
    }
    filtered_counts = _compute_filtered_counts(builder, type_ids_with_filters, geometry)

    categories = {}
    for at in asset_types:
        sub_cat = at.sub_category_id
        cat = sub_cat.category_id

        if cat.id not in categories:
            categories[cat.id] = {"id": str(cat.id), "name": cat.name, "subCategories": {}}

        sub_cats = categories[cat.id]["subCategories"]
        if sub_cat.id not in sub_cats:
            sub_cats[sub_cat.id] = {"id": str(sub_cat.id), "name": sub_cat.name, "assetTypes": []}

        if at.id in type_ids_with_filters:
            filtered_count = filtered_counts.get(at.id, 0)
        else:
            filtered_count = at.asset_count

        sub_cats[sub_cat.id]["assetTypes"].append(
            {
                "id": str(at.id),
                "name": at.name,
                "assetCount": at.asset_count,
                "filteredAssetCount": filtered_count,
                "isActive": at.id in visible_type_ids,
                "datasourceId": str(at.data_source_id_id) if at.data_source_id_id else None,
            }
        )

    return [
        {"id": c["id"], "name": c["name"], "subCategories": list(c["subCategories"].values())}
        for c in categories.values()
    ]


class ScenarioAssetTypesView(APIView):
    """View for listing asset types with visibility status for a scenario."""

    def get(self, request, scenario_id):
        """List asset categories with nested subcategories and asset types."""
        get_object_or_404(Scenario, id=scenario_id)
        focus_area_id = request.query_params.get("focus_area_id")
        user_id = get_user_id_from_request(request)

        visible_q = VisibleAsset.objects.filter(focus_area_id=focus_area_id)
        visible_type_ids = set(visible_q.values_list("asset_type_id", flat=True))

        type_filters = _get_focus_area_score_filters(focus_area_id)
        ctx = FilterContext(scenario_id, user_id, type_filters, None)
        builder = AssetFilterBuilder(ctx)

        focus_area = None
        asset_types_q = AssetType.objects.select_related(
            "sub_category_id__category_id", "data_source_id"
        )
        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea, id=focus_area_id, scenario_id=scenario_id, user_id=user_id
            )

        if focus_area and focus_area.geometry:
            asset_types_q = asset_types_q.annotate(
                asset_count=Count(
                    "assets", filter=Q(assets__geom__within=focus_area.geometry), distinct=True
                )
            ).filter(asset_count__gt=0)
        else:
            asset_types_q = asset_types_q.annotate(asset_count=Count("assets", distinct=True))

        asset_types = asset_types_q.order_by(
            "sub_category_id__category_id__name", "sub_category_id__name", "name"
        )

        result = _build_categories_response(asset_types, visible_type_ids, builder, focus_area)
        return Response(result)
