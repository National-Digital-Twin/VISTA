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


class BulkCriticalityUpdateSerializer(serializers.Serializer):
    """Serializer for bulk criticality update requests."""

    asset_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    criticality_score = serializers.IntegerField(min_value=0, max_value=3)
