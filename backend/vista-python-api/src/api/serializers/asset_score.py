"""Serializers for AssetScore model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import AssetScore


class AssetScoreSerializer(serializers.ModelSerializer):
    """Serializer for the AssetScore model."""

    class Meta:
        """Configuration for the `AssetScoreSerializer`."""

        model = AssetScore
        fields: ClassVar[list[str]] = [
            "id",
            "scenario_id",
            "user_id",
            "criticality_score",
            "dependency_score",
            "exposure_score",
            "redundancy_score",
        ]
