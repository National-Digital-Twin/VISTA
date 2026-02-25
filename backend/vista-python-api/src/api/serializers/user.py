"""Serializers for user-related data."""

from typing import ClassVar

from rest_framework import serializers

from api.models.group import Group, GroupMembership
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
    group_ids = serializers.ListField(child=serializers.UUIDField())

    def validate_group_ids(self, value):
        """Validate expected request attributes are present and valid."""
        existing_ids = set(Group.objects.filter(id__in=value).values_list("id", flat=True))

        missing_ids = set(value) - existing_ids
        if missing_ids:
            raise serializers.ValidationError(f"Invalid group IDs: {sorted(missing_ids)}")

        return value


class UserInviteSerializer(serializers.ModelSerializer):
    """Serializer for the User Invite model."""

    email_address = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `UserInviteSerializer`."""

        model = UserInvite
        fields: ClassVar[list[str]] = [
            "id",
            "user_id",
            "status",
            "groups",
            "created_at",
            "created_by",
            "email_address",
            "user_type",
        ]

    def get_email_address(self, obj):
        """Get email address of user from serializer context."""
        user = self.context["idp_user_map"].get(str(obj.user_id))
        if user:
            return user.email
        return None

    def get_user_type(self, obj):
        """Get type of user from serializer context."""
        user = self.context["idp_user_map"].get(str(obj.user_id))
        if user:
            return user.user_type
        return None

    def get_groups(self, obj):
        """Get list of group names for user."""
        return GroupMembership.objects.filter(user_id=obj.user_id).values_list(
            "group__name", flat=True
        )
