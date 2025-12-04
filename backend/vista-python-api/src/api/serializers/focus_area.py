"""Serializers for the FocusArea model."""

import json
from typing import ClassVar

from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models import FocusArea


class FocusAreaSerializer(serializers.ModelSerializer):
    """Serializer for FocusArea model."""

    geometry = GeometryField()

    class Meta:
        """Configuration for the serializer."""

        model = FocusArea
        fields: ClassVar[list[str]] = ["id", "name", "is_active", "geometry"]
        read_only_fields: ClassVar[list[str]] = ["id"]


class FocusAreaCreateSerializer(serializers.Serializer):
    """Serializer for creating a FocusArea."""

    geometry = serializers.JSONField()
    name = serializers.CharField(required=False, max_length=255, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_geometry(self, value):
        """Convert GeoJSON geometry to GEOS geometry."""
        try:
            geojson_str = json.dumps(value)
            return GEOSGeometry(geojson_str, srid=4326)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid geometry: {e}") from e


class FocusAreaUpdateSerializer(serializers.Serializer):
    """Serializer for updating a FocusArea."""

    name = serializers.CharField(required=False, max_length=255)
    is_active = serializers.BooleanField(required=False)
    geometry = serializers.JSONField(required=False, allow_null=True)

    def validate_geometry(self, value):
        """Convert GeoJSON geometry to GEOS geometry."""
        if value is None:
            return None
        try:
            geojson_str = json.dumps(value)
            return GEOSGeometry(geojson_str, srid=4326)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid geometry: {e}") from e
