"""Serializers for route calculation."""

from rest_framework import serializers


class RouteCalculateSerializer(serializers.Serializer):
    """Serializer for route calculation input."""

    start_lat = serializers.FloatField(min_value=-90, max_value=90)
    start_lon = serializers.FloatField(min_value=-180, max_value=180)
    end_lat = serializers.FloatField(min_value=-90, max_value=90)
    end_lon = serializers.FloatField(min_value=-180, max_value=180)
    vehicle = serializers.ChoiceField(
        choices=["Car", "EmergencyVehicle", "HGV"],
        required=False,
        allow_null=True,
    )
