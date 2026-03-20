# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for constraint interventions."""

from rest_framework import serializers

from api.serializers.geometry import GeometryValidationMixin


class ConstraintInterventionCreateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for creating a constraint intervention."""

    type_id = serializers.UUIDField(required=True)
    geometry = serializers.JSONField(required=True)
    name = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ConstraintInterventionUpdateSerializer(GeometryValidationMixin, serializers.Serializer):
    """Serializer for updating a constraint intervention."""

    name = serializers.CharField(required=False, max_length=255)
    geometry = serializers.JSONField(required=False)
    is_active = serializers.BooleanField(required=False)
