"""Serializers for ExposureLayer model."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models import ExposureLayer, ExposureLayerType


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
