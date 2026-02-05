"""Database-backed constraint provider."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.contrib.gis.db.models import GeometryField
from django.db.models.expressions import RawSQL
from shapely import make_valid, wkb

from api.models import Asset, ConstraintIntervention, ExposureLayer, FocusArea

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

        if scenario_id and user_id and self._is_mapwide_active(scenario_id, user_id):
            geometries.extend(self._get_constraint_geometries(scenario_id, user_id))
            geometries.extend(self._get_flood_geometries(scenario_id, user_id))

        if vehicle:
            geometries.extend(self._get_bridge_geometries(vehicle))

        return geometries

    @staticmethod
    def _is_mapwide_active(scenario_id: UUID, user_id: UUID) -> bool:
        """Check if the map-wide focus area is active for this scenario and user."""
        return FocusArea.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_system=True,
            is_active=True,
        ).exists()

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
        """Get geometries from visible flood exposure layers on the map-wide focus area."""
        flood_layers = ExposureLayer.objects.filter(
            type__name="Floods",
            visible_in__focus_area__scenario_id=scenario_id,
            visible_in__focus_area__user_id=user_id,
            visible_in__focus_area__is_system=True,
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
