"""Serializers for Asset models."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType


class AssetTypeSerializer(serializers.ModelSerializer):
    """Serializer for the Asset Type model."""

    class Meta:
        """Configuration for the `AssetTypeSerializer`."""

        model = AssetType
        fields: ClassVar[list[str]] = ["id", "name", "icon"]


class AssetSubCategorySerializer(serializers.ModelSerializer):
    """Serializer for the Asset Sub Category model."""

    asset_types = AssetTypeSerializer(many=True, read_only=True)

    class Meta:
        """Configuration for the `AssetSubCategorySerializer`."""

        model = AssetSubCategory
        fields: ClassVar[list[str]] = ["id", "name", "asset_types"]


class AssetCategorySerializer(serializers.ModelSerializer):
    """Serializer for the Asset Category model."""

    sub_categories = AssetSubCategorySerializer(many=True, read_only=True)

    class Meta:
        """Configuration for the `AssetCategorySerializer`."""

        model = AssetCategory
        fields: ClassVar[list[str]] = ["id", "name", "sub_categories"]


class AssetListSerializer(serializers.ModelSerializer):
    """Serializer for the Asset model for list view."""

    type = AssetTypeSerializer()

    class Meta:
        """Configuration for the `AssetSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = ["id", "name", "geom", "type"]


class ScenarioAssetSerializer(serializers.ModelSerializer):
    """Serializer for assets in scenario context with GeoJSON geometry."""

    type = AssetTypeSerializer()
    geometry = GeometryField(source="geom")

    class Meta:
        """Configuration for the `ScenarioAssetSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = ["id", "name", "geometry", "type"]


class AssetDetailSerializer(serializers.ModelSerializer):
    """Serializer for the Asset model for detailed view."""

    type = AssetTypeSerializer()
    providers = serializers.SerializerMethodField()
    dependents = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `AssetSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = [
            "id",
            "external_id",
            "name",
            "geom",
            "type",
            "providers",
            "dependents",
        ]

    def get_providers(self, obj):
        """Get providers for asset."""
        deps = obj.dependent.all()
        return AssetListSerializer((d.provider_asset for d in deps), many=True).data

    def get_dependents(self, obj):
        """Get dependents of asset."""
        deps = obj.provider.all()
        return AssetListSerializer((d.dependent_asset for d in deps), many=True).data


class AssetExternalIdLookupSerializer(serializers.ModelSerializer):
    """Serializer used for resolving assets by external ID."""

    class Meta:
        """Configuration for the `AssetExternalIdLookupSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = ["id", "name"]
