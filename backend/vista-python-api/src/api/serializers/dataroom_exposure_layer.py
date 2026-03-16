# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for dataroom exposure layer endpoints."""

import json
from typing import ClassVar

from rest_framework import serializers

from api.models.exposure_layer import ExposureLayer, ExposureLayerType


class ExposureLayerTypeInfoSerializer(serializers.ModelSerializer):
    """Nested serializer for exposure layer type info."""

    class Meta:
        """Configuration for the ExposureLayerTypeInfoSerializer."""

        model = ExposureLayerType
        fields: ClassVar[list[str]] = ["id", "name"]


class DataroomExposureLayerSerializer(serializers.ModelSerializer):
    """Serializer for exposure layers in the dataroom list view."""

    geometry = serializers.SerializerMethodField()
    is_user_defined = serializers.BooleanField(read_only=True)
    status = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    type = ExposureLayerTypeInfoSerializer()

    class Meta:
        """Configuration for the DataroomExposureLayerSerializer."""

        model = ExposureLayer
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "geometry",
            "status",
            "is_user_defined",
            "created_at",
            "updated_at",
            "user",
            "type",
            "published_id",
        ]

    def get_geometry(self, obj):
        """Return geometry as GeoJSON."""
        return json.loads(obj.geometry.json) if obj.geometry else None

    def get_status(self, obj):
        """Return status for user-defined layers, null for system layers."""
        return obj.status if obj.is_user_defined else None

    def get_updated_at(self, obj):
        """Return updated_at (placeholder: returns created_at until field is added)."""
        return self.fields["created_at"].to_representation(obj.created_at)

    def get_user(self, obj):
        """Return user info for user-defined layers, null for system layers."""
        if obj.user_id is None:
            return None
        user_name_map = self.context.get("user_name_map", {})
        return {
            "id": str(obj.user_id),
            "name": user_name_map.get(str(obj.user_id)),
        }
