"""Serializers for user-related data."""

from typing import ClassVar

from rest_framework import serializers

from api.models.group import Group
from api.models.user_invite import UserInvite


class IdpUserSerializer(serializers.Serializer):
    """Serializer for the IdpUser domain object."""

    id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField(allow_null=True, required=False)
    enabled = serializers.BooleanField()
    status = serializers.CharField(allow_null=True, required=False)
    user_since = serializers.CharField()
    user_type = serializers.CharField()


class UserCreateSerializer(serializers.Serializer):
    """Serializer for creating a user."""

    email = serializers.EmailField()
    user_type = serializers.ChoiceField(choices=["general", "admin"], required=True)
    group_ids = serializers.ListField(child=serializers.CharField())

    def validate_group_ids(self, value):
        """Validate expected request attributes are present and valid."""
        existing_ids = set(Group.objects.filter(id__in=value).values_list("id", flat=True))

        missing_ids = set(value) - existing_ids
        if missing_ids:
            raise serializers.ValidationError(f"Invalid group IDs: {sorted(missing_ids)}")

        return value


class UserInviteSerializer(serializers.ModelSerializer):
    """Serializer for the User Invite model."""

    class Meta:
        """Configuration for the `UserInviteSerializer`."""

        model = UserInvite
        fields: ClassVar[list[str]] = ["user_id", "status", "created_by"]
