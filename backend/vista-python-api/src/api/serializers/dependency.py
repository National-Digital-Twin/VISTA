# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
