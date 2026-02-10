"""Serializers for resource intervention type visibility."""

from rest_framework import serializers


class VisibleResourceInterventionTypeToggleSerializer(serializers.Serializer):
    """Serializer for toggling resource intervention type visibility."""

    resource_intervention_type_id = serializers.UUIDField(required=True)
    is_active = serializers.BooleanField(required=True)
