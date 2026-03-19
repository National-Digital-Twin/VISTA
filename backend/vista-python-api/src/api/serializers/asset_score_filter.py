# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for asset score filter operations."""

from typing import ClassVar

from rest_framework import serializers

from api.models import AssetScoreFilter


class AssetScoreFilterSerializer(serializers.ModelSerializer):
    """Serializer for reading AssetScoreFilter."""

    class Meta:
        """Configuration for the serializer."""

        model = AssetScoreFilter
        fields: ClassVar[list[str]] = [
            "id",
            "focus_area_id",
            "asset_type_id",
            "criticality_values",
            "exposure_values",
            "redundancy_values",
            "dependency_min",
            "dependency_max",
        ]


class AssetScoreFilterCreateUpdateSerializer(serializers.Serializer):
    """Serializer for creating/updating asset score filter."""

    focus_area_id = serializers.UUIDField(required=True)
    asset_type_id = serializers.UUIDField(required=False, allow_null=True)
    criticality_values = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=3),
        required=False,
        allow_null=True,
    )
    exposure_values = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=3),
        required=False,
        allow_null=True,
    )
    redundancy_values = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=3),
        required=False,
        allow_null=True,
    )
    dependency_min = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    dependency_max = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    def validate(self, data):
        """Validate dependency range - both min and max must be provided together."""
        dep_min = data.get("dependency_min")
        dep_max = data.get("dependency_max")

        if (dep_min is None) != (dep_max is None):
            raise serializers.ValidationError(
                {"dependency_min": "Both dependency_min and dependency_max must be provided"}
            )

        if dep_min is not None and dep_max is not None and dep_min > dep_max:
            raise serializers.ValidationError(
                {"dependency_min": "dependency_min must be less than or equal to dependency_max"}
            )

        return data
