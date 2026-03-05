# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for the FocusArea model."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models import FocusArea
from api.serializers.geometry import GeometryValidationMixin


class FocusAreaSerializer(serializers.ModelSerializer):
    """Serializer for FocusArea model."""

    geometry = GeometryField(allow_null=True)

    class Meta:
        """Configuration for the serializer."""

        model = FocusArea
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "geometry",
            "filter_mode",
            "is_active",
            "is_system",
            "created_at",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "is_system", "created_at"]


class FocusAreaCreateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for creating a FocusArea."""

    geometry = serializers.JSONField()
    name = serializers.CharField(required=False, max_length=255, allow_blank=True)


class FocusAreaUpdateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for updating a FocusArea."""

    name = serializers.CharField(required=False, max_length=255)
    geometry = serializers.JSONField(required=False, allow_null=True)
    filter_mode = serializers.ChoiceField(
        choices=["by_asset_type", "by_score_only"], required=False
    )
    is_active = serializers.BooleanField(required=False)
