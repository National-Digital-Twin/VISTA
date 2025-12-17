"""Serializers for user-related data."""

from rest_framework import serializers


class IdpUserSerializer(serializers.Serializer):
    """Serializer for the IdpUser domain object."""

    id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField(allow_null=True, required=False)
    enabled = serializers.BooleanField()
    status = serializers.CharField(allow_null=True, required=False)
    user_since = serializers.CharField()
    user_type = serializers.CharField()
