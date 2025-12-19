"""Serializers for exposure layer visibility toggling."""

from rest_framework import serializers


class VisibleExposureLayerToggleSerializer(serializers.Serializer):
    """Serializer for toggling exposure layer visibility."""

    exposure_layer_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField()
    is_active = serializers.BooleanField()


class VisibleExposureLayerResponseSerializer(serializers.Serializer):
    """Serializer for the visibility toggle response."""

    exposure_layer_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField()
    is_active = serializers.BooleanField()
