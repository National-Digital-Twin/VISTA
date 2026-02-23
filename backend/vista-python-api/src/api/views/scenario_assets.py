"""View for listing assets filtered by scenario visibility settings."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from api.filters import AssetFilterBuilder, FilterContext
from api.models import FocusArea, Scenario
from api.models.asset import Asset
from api.serializers import ScenarioAssetSerializer
from api.services.data_source_access_service import get_asset_types_user_cannot_access
from api.utils.auth import get_user_id_from_request


def _build_focus_area_q(focus_area: FocusArea, scenario_id, user_id, exclude_q=None) -> Q:
    """Build Q filter for a focus area based on its mode and relations."""
    type_filters = {}
    global_filter = None
    for sf in focus_area.asset_score_filters.all():
        if sf.asset_type_id is None:
            global_filter = sf
        else:
            type_filters[sf.asset_type_id] = sf

    visible_type_ids = {va.asset_type_id for va in focus_area.visible_assets.all()}
    disallowed_type_ids = get_asset_types_user_cannot_access(user_id)

    ctx = FilterContext(
        scenario_id, user_id, focus_area.id, type_filters, global_filter, disallowed_type_ids
    )
    builder = AssetFilterBuilder(ctx)

    if focus_area.filter_mode == "by_score_only":
        return builder.build_by_score_only(focus_area.geometry, exclude_q)
    return builder.build_by_asset_type(visible_type_ids, focus_area.geometry, exclude_q)


class ScenarioAssetsView(APIView):
    """View for listing assets filtered by scenario visibility settings."""

    def get(self, request, scenario_id):
        """List assets visible in the scenario for the current user."""
        get_object_or_404(Scenario, id=scenario_id)
        user_id = get_user_id_from_request(request)
        focus_area_id = request.query_params.get("focus_area_id", None)

        if focus_area_id:
            focus_area = get_object_or_404(
                FocusArea.objects.prefetch_related("visible_assets", "asset_score_filters"),
                id=focus_area_id,
                scenario_id=scenario_id,
                user_id=user_id,
            )
            combined_q = _build_focus_area_q(focus_area, scenario_id, user_id)
            if not combined_q:
                return Response([])
            assets = Asset.objects.filter(combined_q).select_related("type").distinct()
            return Response(ScenarioAssetSerializer(assets, many=True).data)

        focus_areas = FocusArea.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_active=True,
        ).prefetch_related("visible_assets", "asset_score_filters")

        map_wide_fa = None
        geo_focus_areas = []
        for fa in focus_areas:
            if fa.geometry is None:
                map_wide_fa = fa
            else:
                geo_focus_areas.append(fa)

        geo_covered_q = Q()
        for fa in geo_focus_areas:
            geo_covered_q |= Q(geom__within=fa.geometry)

        combined_q = Q()
        for fa in geo_focus_areas:
            combined_q |= _build_focus_area_q(fa, scenario_id, user_id)

        if map_wide_fa:
            exclude_q = geo_covered_q if geo_focus_areas else None
            combined_q |= _build_focus_area_q(map_wide_fa, scenario_id, user_id, exclude_q)

        if not combined_q:
            return Response([])

        assets = Asset.objects.filter(combined_q).select_related("type").distinct()
        return Response(ScenarioAssetSerializer(assets, many=True).data)
