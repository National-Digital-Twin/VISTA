"""Serializers for the FocusArea model."""

import json
from typing import ClassVar

from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models import FocusArea


class FocusAreaSerializer(serializers.ModelSerializer):
    """Serializer for FocusArea model."""

    geometry = GeometryField(allow_null=True)

    class Meta:
        """Configuration for the serializer."""

        model = FocusArea
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "geometry",
            "filter_mode",
            "is_active",
            "is_system",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "is_system"]


class FocusAreaCreateSerializer(serializers.Serializer):
    """Serializer for creating a FocusArea."""

    geometry = serializers.JSONField()
    name = serializers.CharField(required=False, max_length=255, allow_blank=True)

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
    geometry = serializers.JSONField(required=False, allow_null=True)
    filter_mode = serializers.ChoiceField(
        choices=["by_asset_type", "by_score_only"], required=False
    )
    is_active = serializers.BooleanField(required=False)

    def validate_geometry(self, value):
        """Convert GeoJSON geometry to GEOS geometry."""
        if value is None:
            return None
        try:
            geojson_str = json.dumps(value)
            return GEOSGeometry(geojson_str, srid=4326)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid geometry: {e}") from e
