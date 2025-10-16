"""Serializer for application models."""

from typing import ClassVar

from rest_framework import serializers

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from api.models.dependency import Dependency


class AssetCategorySerializer(serializers.ModelSerializer):
    """Serializer for the Asset Category model."""

    class Meta:
        """Configuration for the `AssetCategorySerializer`."""

        model = AssetCategory
        fields: ClassVar[list[str]] = ["id", "name"]


class AssetSubCategorySerializer(serializers.ModelSerializer):
    """Serializer for the Asset Sub Category model."""

    class Meta:
        """Configuration for the `AssetSubCategorySerializer`."""

        model = AssetSubCategory
        fields: ClassVar[list[str]] = ["id", "name", "category_id"]


class AssetTypeSerializer(serializers.ModelSerializer):
    """Serializer for the Asset Type model."""

    class Meta:
        """Configuration for the `AssetTypeSerializer`."""

        model = AssetType
        fields: ClassVar[list[str]] = ["id", "name", "sub_category_id"]


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for the Asset model."""

    type = AssetTypeSerializer()

    class Meta:
        """Configuration for the `AssetSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = ["id", "name", "geom", "type"]


class DependencySerializer(serializers.ModelSerializer):
    """Serializer for the Dependency model."""

    class Meta:
        """Configuration for the `DependencySerializer`."""

        model = Dependency
        fields: ClassVar[list[str]] = ["id", "provider_asset", "dependent_asset"]
        read_only_fields: ClassVar[list[str]] = ["id"]
