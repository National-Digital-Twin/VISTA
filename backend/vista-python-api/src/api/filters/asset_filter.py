"""Asset filter builder for score-based filtering."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from django.contrib.gis.geos import Polygon
from django.db.models import Q

from api.models import AssetScoreFilter
from api.models.asset_score import AssetScore, VisibleExposureAssetScore


def has_criteria(score_filter: AssetScoreFilter | None) -> bool:
    """Check if a score filter has any criteria set."""
    if score_filter is None:
        return False
    return (
        score_filter.criticality_values is not None
        or score_filter.exposure_values is not None
        or score_filter.redundancy_values is not None
        or score_filter.dependency_min is not None
        or score_filter.dependency_max is not None
    )


@dataclass
class FilterContext:
    """Context for building asset filters within a scope."""

    scenario_id: UUID
    user_id: UUID
    focus_area_id: UUID
    type_filters: dict[UUID, AssetScoreFilter]
    global_filter: AssetScoreFilter | None


class AssetFilterBuilder:
    """Builds Django Q filters for asset queries based on score criteria."""

    def __init__(self, ctx: FilterContext):
        """Initialize builder with filter context."""
        self.ctx = ctx

    def _base_score_subquery(self, score_filter: AssetScoreFilter | None = None):
        """Build subquery for asset IDs matching non-exposure score criteria.

        Queries AssetScore view for criticality, dependency, redundancy.
        """
        query = AssetScore.objects.filter(scenario_id=self.ctx.scenario_id)

        if score_filter is not None:
            if score_filter.criticality_values is not None:
                query = query.filter(
                    criticality_score__in=[Decimal(v) for v in score_filter.criticality_values]
                )
            if score_filter.redundancy_values is not None:
                query = query.filter(
                    redundancy_score__in=[Decimal(v) for v in score_filter.redundancy_values]
                )
            if score_filter.dependency_min is not None:
                query = query.filter(dependency_score__gte=score_filter.dependency_min)
            if score_filter.dependency_max is not None:
                query = query.filter(dependency_score__lte=score_filter.dependency_max)
        return query.values("id")

    def _build_exposure_q(self, exposure_values: list[int]) -> Q:
        """Build Q filter for exposure score criteria.

        The visible_exposure_asset_scores view only contains rows for assets within
        500m of an exposure layer. Assets far from all layers have no row, meaning
        their implicit score is 0.

        - score 1/2/3: filter where asset_id IN view with matching score
        - score 0: filter where asset_id NOT IN view (no exposure layer nearby)
        - all scores [0,1,2,3]: no filter needed, matches everything
        """
        exposure_set = set(exposure_values)

        # All scores selected - no filter needed
        if exposure_set >= {0, 1, 2, 3}:
            return Q()

        non_zero_values = [v for v in exposure_values if v != 0]
        include_zero = 0 in exposure_set

        # Mixed: both zero and non-zero scores (e.g., [0, 2])
        if include_zero and non_zero_values:
            assets_in_view = VisibleExposureAssetScore.objects.filter(
                focus_area_id=self.ctx.focus_area_id
            ).values("asset_id")
            assets_with_matching_scores = VisibleExposureAssetScore.objects.filter(
                focus_area_id=self.ctx.focus_area_id,
                score__in=non_zero_values,
            ).values("asset_id")
            return Q(id__in=assets_with_matching_scores) | ~Q(id__in=assets_in_view)

        # Only non-zero scores (1, 2, 3)
        if non_zero_values:
            return Q(
                id__in=VisibleExposureAssetScore.objects.filter(
                    focus_area_id=self.ctx.focus_area_id,
                    score__in=non_zero_values,
                ).values("asset_id")
            )

        # Only zero - assets NOT in the view
        return ~Q(
            id__in=VisibleExposureAssetScore.objects.filter(
                focus_area_id=self.ctx.focus_area_id
            ).values("asset_id")
        )

    def type_filter(self, type_id: UUID, geometry: Polygon | None = None) -> Q:
        """Build Q for a single asset type, optionally constrained by geometry and scores."""
        score_filter = self.ctx.type_filters.get(type_id)
        base_q = Q(type_id=type_id)
        if geometry:
            base_q &= Q(geom__within=geometry)
        if has_criteria(score_filter):
            base_q &= self._build_score_filter_q(score_filter)
        return base_q

    def _build_score_filter_q(self, score_filter: AssetScoreFilter) -> Q:
        """Build Q filter for score criteria, handling base and exposure separately."""
        result = Q()

        has_base_criteria = (
            score_filter.criticality_values is not None
            or score_filter.redundancy_values is not None
            or score_filter.dependency_min is not None
            or score_filter.dependency_max is not None
        )
        if has_base_criteria:
            result &= Q(id__in=self._base_score_subquery(score_filter))

        if score_filter.exposure_values is not None:
            result &= self._build_exposure_q([int(v) for v in score_filter.exposure_values])

        return result

    def build_by_asset_type(
        self,
        visible_type_ids: set[UUID],
        geometry: Polygon | None = None,
        exclude_q: Q | None = None,
    ) -> Q:
        """Build filter for by_asset_type mode."""
        if not visible_type_ids:
            return Q()
        result = Q()
        for type_id in visible_type_ids:
            result |= self.type_filter(type_id, geometry)
        if exclude_q:
            result &= ~exclude_q
        return result

    def build_by_score_only(self, geometry: Polygon | None = None, exclude_q: Q | None = None) -> Q:
        """Build filter for by_score_only mode (all types, require score existence)."""
        gf = self.ctx.global_filter if has_criteria(self.ctx.global_filter) else None

        result = self._build_score_filter_q(gf) if gf else Q(id__in=self._base_score_subquery(None))

        if geometry:
            result &= Q(geom__within=geometry)
        if exclude_q:
            result &= ~exclude_q
        return result
