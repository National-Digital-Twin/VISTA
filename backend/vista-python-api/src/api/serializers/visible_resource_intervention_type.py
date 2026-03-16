# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Serializers for resource intervention type visibility."""

from rest_framework import serializers


class VisibleResourceInterventionTypeToggleSerializer(serializers.Serializer):
    """Serializer for toggling resource intervention type visibility."""

    resource_intervention_type_id = serializers.UUIDField(required=True)
    is_active = serializers.BooleanField(required=True)
