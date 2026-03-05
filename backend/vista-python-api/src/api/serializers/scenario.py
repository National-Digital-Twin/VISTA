# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
