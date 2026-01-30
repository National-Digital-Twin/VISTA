"""Database-backed constraint provider."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.contrib.gis.db.models import GeometryField
from django.db.models.expressions import RawSQL
from shapely import make_valid, wkb

from api.models import Asset, ConstraintIntervention, ExposureLayer, FocusArea, VisibleExposureLayer

if TYPE_CHECKING:
    from uuid import UUID

    from shapely.geometry.base import BaseGeometry

logger = logging.getLogger(__name__)

BUFFER_METERS = 10


class ConstraintProvider:
    """Fetches routing constraint geometries."""

    @staticmethod
    def _to_shapely(geom_field) -> BaseGeometry:
        """Convert a Django GIS geometry field to a valid Shapely geometry."""
        return make_valid(wkb.loads(bytes(geom_field.wkb)))

    def get_blocked_geometries(
        self,
        scenario_id: UUID | None = None,
        user_id: UUID | None = None,
        vehicle: str | None = None,
    ) -> list[BaseGeometry]:
        """Get all geometries that should block routing."""
        geometries: list[BaseGeometry] = []

        if scenario_id and user_id:
            geometries.extend(self._get_constraint_geometries(scenario_id, user_id))
            geometries.extend(self._get_flood_geometries(scenario_id, user_id))

        if vehicle:
            geometries.extend(self._get_bridge_geometries(vehicle))

        return geometries

    def _get_constraint_geometries(
        self,
        scenario_id: UUID,
        user_id: UUID,
    ) -> list[BaseGeometry]:
        """Get geometries from constraint interventions.

        LineStrings are buffered by BUFFER_METERS in the query; polygons are returned as-is.
        """
        constraints = ConstraintIntervention.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_active=True,
            type__impacts_routing=True,
        ).annotate(
            routing_geom=RawSQL(
                """
                CASE ST_GeometryType(geometry)
                    WHEN 'ST_LineString'
                        THEN ST_Buffer(geometry::geography, %s)::geometry
                    ELSE geometry
                END
                """,
                [BUFFER_METERS],
                output_field=GeometryField(),
            ),
        )

        return [self._to_shapely(c.routing_geom) for c in constraints]

    def _get_flood_geometries(
        self,
        scenario_id: UUID,
        user_id: UUID,
    ) -> list[BaseGeometry]:
        """Get geometries from visible flood exposure layers."""
        focus_area_ids = FocusArea.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_active=True,
        ).values_list("id", flat=True)

        if not focus_area_ids:
            return []

        visible_layer_ids = VisibleExposureLayer.objects.filter(
            focus_area_id__in=focus_area_ids
        ).values_list("exposure_layer_id", flat=True)

        if not visible_layer_ids:
            return []

        flood_layers = ExposureLayer.objects.filter(
            id__in=visible_layer_ids,
            type__name="Floods",
        ).only("geometry")

        return [self._to_shapely(layer.geometry) for layer in flood_layers]

    def _get_bridge_geometries(self, vehicle: str) -> list[BaseGeometry]:
        """Get buffered geometries for low bridges (HGV only)."""
        if vehicle != "HGV":
            return []

        bridges = Asset.objects.filter(type__name="Low bridge").annotate(
            buffered_geom=RawSQL(
                "ST_Buffer(geom::geography, %s)::geometry",
                [BUFFER_METERS],
                output_field=GeometryField(),
            ),
        )

        return [self._to_shapely(bridge.buffered_geom) for bridge in bridges]
