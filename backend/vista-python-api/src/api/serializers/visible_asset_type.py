"""Serializers for asset type visibility toggling."""

from rest_framework import serializers


class VisibleAssetTypeToggleSerializer(serializers.Serializer):
    """Serializer for toggling asset type visibility."""

    asset_type_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField(required=False, allow_null=True)
    is_active = serializers.BooleanField()


class VisibleAssetTypeResponseSerializer(serializers.Serializer):
    """Serializer for the visibility toggle response."""

    asset_type_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField(allow_null=True)
    is_active = serializers.BooleanField()
