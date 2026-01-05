"""Asset filter builder for score-based filtering."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from django.contrib.gis.geos import Polygon
from django.db.models import Exists, OuterRef, Q

from api.models import AssetScoreFilter
from api.models.asset_score import AssetScore


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
    type_filters: dict[UUID, AssetScoreFilter]
    global_filter: AssetScoreFilter | None


class AssetFilterBuilder:
    """Builds Django Q filters for asset queries based on score criteria."""

    def __init__(self, ctx: FilterContext):
        """Initialize builder with filter context."""
        self.ctx = ctx

    def _score_subquery(self, score_filter: AssetScoreFilter | None = None):
        """Build subquery for asset IDs matching score criteria."""
        user_score_exists = AssetScore.objects.filter(
            scenario_id=self.ctx.scenario_id,
            user_id=self.ctx.user_id,
            id=OuterRef("id"),
        )
        query = AssetScore.objects.filter(scenario_id=self.ctx.scenario_id).filter(
            Q(user_id=self.ctx.user_id) | (Q(user_id__isnull=True) & ~Exists(user_score_exists))
        )

        if score_filter is not None:
            if score_filter.criticality_values is not None:
                query = query.filter(
                    criticality_score__in=[Decimal(v) for v in score_filter.criticality_values]
                )
            if score_filter.exposure_values is not None:
                query = query.filter(
                    exposure_score__in=[Decimal(v) for v in score_filter.exposure_values]
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

    def type_filter(self, type_id: UUID, geometry: Polygon | None = None) -> Q:
        """Build Q for a single asset type, optionally constrained by geometry and scores."""
        score_filter = self.ctx.type_filters.get(type_id)
        base_q = Q(type_id=type_id)
        if geometry:
            base_q &= Q(geom__within=geometry)
        if has_criteria(score_filter):
            base_q &= Q(id__in=self._score_subquery(score_filter))
        return base_q

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
        result = Q(id__in=self._score_subquery(gf))
        if geometry:
            result &= Q(geom__within=geometry)
        if exclude_q:
            result &= ~exclude_q
        return result
