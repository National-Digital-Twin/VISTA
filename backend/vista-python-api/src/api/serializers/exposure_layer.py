# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for ExposureLayer model."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models import ExposureLayer, ExposureLayerType
from api.serializers.geometry import GeometryValidationMixin


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
        fields: ClassVar[list[str]] = ["id", "name", "exposure_layers", "is_user_editable"]


class ExposureLayerCreateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for creating a user-drawn exposure layer."""

    type_id = serializers.UUIDField()
    geometry = serializers.JSONField()
    name = serializers.CharField(required=False, max_length=255, allow_blank=True)
    focus_area_id = serializers.UUIDField(required=False)


class ExposureLayerUpdateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for updating a user-drawn exposure layer."""

    name = serializers.CharField(required=False, max_length=255)
    geometry = serializers.JSONField(required=False)
