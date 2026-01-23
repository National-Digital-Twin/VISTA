"""Serializers for the Scenario model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import Group, GroupMembership


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for the Asset Sub Category model."""

    name = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `AssetSubCategorySerializer`."""

        model = GroupMembership
        fields: ClassVar[list[str]] = ["name"]

    def get_name(self, obj):
        """Get name of user from serializer context."""
        user = self.context["idp_user_map"].get(obj.user_id)
        if user:
            return user.name
        return None


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for the Scenario model."""

    members = GroupMembershipSerializer(many=True, read_only=True)

    class Meta:
        """Configuration for the serializer."""

        model = Group
        fields: ClassVar[list[str]] = ["id", "name", "members"]
