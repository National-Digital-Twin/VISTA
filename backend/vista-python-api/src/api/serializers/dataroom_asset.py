# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for dataroom asset endpoints."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models.asset import Asset


class DataroomAssetListSerializer(serializers.ModelSerializer):
    """Serializer for assets in the dataroom list view."""

    geometry = GeometryField(source="geom")
    asset_type_name = serializers.CharField(source="type.name")
    sub_category_name = serializers.CharField(source="type.sub_category.name")
    category_name = serializers.CharField(source="type.sub_category.category.name")
    asset_type_id = serializers.UUIDField(source="type_id")
    criticality_score = serializers.IntegerField()
    criticality_is_overridden = serializers.BooleanField()

    class Meta:
        """Configuration for the DataroomAssetListSerializer."""

        model = Asset
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "geometry",
            "asset_type_id",
            "asset_type_name",
            "sub_category_name",
            "category_name",
            "criticality_score",
            "criticality_is_overridden",
        ]


class CriticalityUpdateItemSerializer(serializers.Serializer):
    """Serializer for a single asset criticality update."""

    asset_id = serializers.UUIDField()
    criticality_score = serializers.IntegerField(min_value=0, max_value=3)


class BulkCriticalityUpdateSerializer(serializers.Serializer):
    """Serializer for bulk criticality update requests."""

    updates = CriticalityUpdateItemSerializer(many=True, allow_empty=False)
