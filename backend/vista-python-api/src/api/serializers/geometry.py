"""Shared geometry validation for serializers."""

import json

from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers


class GeometryValidationMixin:
    """Mixin for validating GeoJSON geometry fields."""

    def validate_geometry(self, value):
        """Convert GeoJSON geometry to GEOS geometry."""
        if value is None:
            return None
        try:
            geojson_str = json.dumps(value)
            return GEOSGeometry(geojson_str, srid=4326)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid geometry: {e}") from e
