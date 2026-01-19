"""Serializers for AssetScore model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import AssetScore


class AssetScoreSerializer(serializers.ModelSerializer):
    """Serializer for the AssetScore model.

    Note: This serializer is for the simplified asset_scores view which no longer
    includes exposure_score (now in VisibleExposureAssetScore) or user_id.
    For the full score response including exposure, use AssetScoreViewSet.retrieve()
    which combines data from both views.
    """

    class Meta:
        """Configuration for the `AssetScoreSerializer`."""

        model = AssetScore
        fields: ClassVar[list[str]] = [
            "id",
            "scenario_id",
            "criticality_score",
            "dependency_score",
            "redundancy_score",
        ]
