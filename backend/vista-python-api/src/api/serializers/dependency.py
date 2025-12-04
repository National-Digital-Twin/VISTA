"""Serializers for Dependency model."""

from typing import ClassVar

from rest_framework import serializers

from api.models.dependency import Dependency

from .asset import AssetListSerializer


class DependencySerializer(serializers.ModelSerializer):
    """Serializer for the Dependency model."""

    provider_asset = AssetListSerializer()
    dependent_asset = AssetListSerializer()

    class Meta:
        """Configuration for the `DependencySerializer`."""

        model = Dependency
        fields: ClassVar[list[str]] = ["id", "provider_asset", "dependent_asset"]
        read_only_fields: ClassVar[list[str]] = ["id"]
