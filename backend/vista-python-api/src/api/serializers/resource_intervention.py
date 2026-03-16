# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for resource interventions."""

from typing import ClassVar

from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from api.models.resource_intervention import ResourceInterventionLocation


class ResourceInterventionActionSerializer(serializers.Serializer):
    """Serializer for withdraw/restock actions."""

    quantity = serializers.IntegerField(min_value=1, required=True)


class ResourceInterventionLocationSerializer(serializers.ModelSerializer):
    """Serializer for resource intervention location responses."""

    geometry = GeometryField()

    class Meta:
        """Configuration for the serializer."""

        model = ResourceInterventionLocation
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "geometry",
            "current_stock",
            "max_capacity",
            "created_at",
            "updated_at",
        ]


class ResourceInterventionTypeWithLocationsSerializer(serializers.Serializer):
    """Serializer for resource type with nested locations."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    unit = serializers.CharField()
    is_active = serializers.BooleanField()
    locations = ResourceInterventionLocationSerializer(many=True)


class ResourceInterventionStockActionResponseSerializer(serializers.Serializer):
    """Serializer for withdraw/restock operation responses."""

    id = serializers.UUIDField()
    current_stock = serializers.IntegerField()
    max_capacity = serializers.IntegerField()
    action = serializers.CharField()
    quantity = serializers.IntegerField()


class ResourceInterventionActionLogSerializer(serializers.Serializer):
    """Serializer for action log entries."""

    id = serializers.UUIDField()
    location_id = serializers.UUIDField(source="location.id")
    location_name = serializers.CharField(source="location.name")
    resource_type = serializers.CharField(source="location.type.name")
    action_type = serializers.CharField()
    quantity = serializers.IntegerField()
    user = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_user(self, obj):
        """Resolve user id and name from context."""
        user_name_map = self.context.get("user_name_map", {})
        user_id = str(obj.user_id)
        return {"id": user_id, "name": user_name_map.get(user_id)}


class PaginationParamsSerializer(serializers.Serializer):
    """Serializer for cursor-based pagination query parameters."""

    cursor = serializers.DateTimeField(required=False)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100, default=50)
    type_id = serializers.UUIDField(required=False)


class ExportParamsSerializer(serializers.Serializer):
    """Serializer for CSV export query parameters."""

    type_id = serializers.UUIDField(required=True)
