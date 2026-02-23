"""Serializers for the Scenario model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import Scenario


class ScenarioSerializer(serializers.ModelSerializer):
    """Serializer for the Scenario model."""

    pending_exposure_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        """Configuration for the serializer."""

        model = Scenario
        fields: ClassVar[list[str]] = ["id", "name", "is_active", "code", "pending_exposure_count"]
        read_only_fields: ClassVar[list[str]] = ["id"]
