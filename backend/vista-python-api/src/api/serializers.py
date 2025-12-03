"""Serializer for application models."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from api.models.dependency import Dependency

from .models import DataSource, ExposureLayer, ExposureLayerType


class AssetTypeSerializer(serializers.ModelSerializer):
    """Serializer for the Asset Type model."""

    class Meta:
        """Configuration for the `AssetTypeSerializer`."""

        model = AssetType
        fields: ClassVar[list[str]] = ["id", "name"]


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


class DataSourceSerializer(serializers.ModelSerializer):
    """Serializer for the DataSource model."""

    asset_count = serializers.IntegerField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)

    class Meta:
        """Configuration for the `DataSourceSerializer`."""

        model = DataSource
        fields: ClassVar[list[str]] = ["id", "name", "owner", "asset_count", "last_updated"]


class IdpUserSerializer(serializers.Serializer):
    """Serializer for the IdpUser domain object."""

    id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField(allow_null=True, required=False)
    enabled = serializers.BooleanField()
    status = serializers.CharField(allow_null=True, required=False)
    user_since = serializers.CharField()


class DependencySerializer(serializers.ModelSerializer):
    """Serializer for the Dependency model."""

    provider_asset = AssetListSerializer()
    dependent_asset = AssetListSerializer()

    class Meta:
        """Configuration for the `DependencySerializer`."""

        model = Dependency
        fields: ClassVar[list[str]] = ["id", "provider_asset", "dependent_asset"]
        read_only_fields: ClassVar[list[str]] = ["id"]


class AssetDetailSerializer(serializers.ModelSerializer):
    """Serializer for the Asset model for detailed view."""

    type = AssetTypeSerializer()
    providers = serializers.SerializerMethodField()
    dependents = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `AssetSerializer`."""

        model = Asset
        fields: ClassVar[list[str]] = ["id", "name", "geom", "type", "providers", "dependents"]

    def get_providers(self, obj):
        """Get providers for asset."""
        deps = obj.dependent.all()
        return AssetListSerializer((d.provider_asset for d in deps), many=True).data

    def get_dependents(self, obj):
        """Get dependents of asset."""
        deps = obj.provider.all()
        return AssetListSerializer((d.dependent_asset for d in deps), many=True).data


class ExposureLayerSerializer(serializers.ModelSerializer):
    """Serializer for the ExposureLayer model."""

    geometry = GeometryField()

    class Meta:
        """Configuration for the `ExposureLayerSerializer`."""

        model = ExposureLayer
        fields: ClassVar[list[str]] = ["id", "name", "geometry"]


class ExposureLayerTypeSerializer(serializers.ModelSerializer):
    """Serializer for the Exposure Layer Type model."""

    exposure_layers = ExposureLayerSerializer(many=True, read_only=True)

    class Meta:
        """Configuration for the `ExposureLayerTypeSerializer`."""

        model = ExposureLayerType
        fields: ClassVar[list[str]] = ["id", "name", "exposure_layers"]
