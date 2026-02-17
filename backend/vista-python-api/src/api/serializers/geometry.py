"""Shared geometry validation for serializers."""

import json

from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSException, GEOSGeometry
from rest_framework import serializers


def parse_geojson(value, srid=4326):
    """Parse a GeoJSON string or dict into a GEOSGeometry.

    Raises serializers.ValidationError if the geometry is invalid.
    """
    try:
        geojson_str = json.dumps(value) if isinstance(value, dict) else value
        return GEOSGeometry(geojson_str, srid=srid)
    except (ValueError, GEOSException, GDALException, TypeError) as e:
        raise serializers.ValidationError(f"Invalid geometry: {e}") from e


class GeometryValidationMixin:
    """Mixin for validating GeoJSON geometry fields."""

    def validate_geometry(self, value):
        """Convert GeoJSON geometry to GEOS geometry."""
        if value is None:
            return None
        return parse_geojson(value)
