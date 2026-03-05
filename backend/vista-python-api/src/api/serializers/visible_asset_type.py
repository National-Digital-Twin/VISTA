# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for asset type visibility toggling."""

from rest_framework import serializers


class VisibleAssetTypeToggleSerializer(serializers.Serializer):
    """Serializer for toggling asset type visibility."""

    asset_type_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField()
    is_active = serializers.BooleanField()


class VisibleAssetTypeResponseSerializer(serializers.Serializer):
    """Serializer for the visibility toggle response."""

    asset_type_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField(allow_null=True)
    is_active = serializers.BooleanField()


class BulkVisibleAssetTypeToggleSerializer(serializers.Serializer):
    """Serializer for bulk toggling asset type visibility by subcategory."""

    sub_category_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField()
    is_active = serializers.BooleanField()


class BulkVisibleAssetTypeResponseSerializer(serializers.Serializer):
    """Serializer for the bulk visibility toggle response."""

    sub_category_id = serializers.UUIDField()
    focus_area_id = serializers.UUIDField()
    is_active = serializers.BooleanField()
