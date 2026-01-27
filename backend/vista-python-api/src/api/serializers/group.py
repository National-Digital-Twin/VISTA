"""Serializers for the Scenario model."""

from typing import ClassVar

from django.db import transaction
from rest_framework import serializers

from api.models import Group, GroupMembership


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for the Asset Sub Category model."""

    group_id = serializers.HiddenField(default=None)
    name = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `AssetSubCategorySerializer`."""

        model = GroupMembership
        fields: ClassVar[list[str]] = ["id", "name", "group_id", "user_id", "created_by"]
        read_only_fields: ClassVar[list[str]] = ["id", "created_by"]
        validators: ClassVar[list[serializers.UniqueTogetherValidator]] = [
            serializers.UniqueTogetherValidator(
                queryset=GroupMembership.objects.all(),
                fields=["group_id", "user_id"],
                message="The user is already a member of this group.",
            )
        ]

    def __init__(self, *args, **kwargs):
        """Initialize fields with group_id value from request context."""
        super().__init__(*args, **kwargs)
        if "view" in self.context:
            self.fields["group_id"].default = self.context["view"].kwargs["group_id"]

    def get_name(self, obj):
        """Get name of user from serializer context."""
        user = self.context["idp_user_map"].get(str(obj.user_id))
        if user:
            return user.name
        return None


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for the Scenario model."""

    members = GroupMembershipSerializer(many=True, read_only=True)

    member_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
    )

    class Meta:
        """Configuration for the serializer."""

        model = Group
        fields: ClassVar[list[str]] = ["id", "name", "members", "member_ids"]
        read_only_fields: ClassVar[list[str]] = ["created_by"]

    @transaction.atomic
    def create(self, validated_data):
        """Create group members."""
        member_ids = validated_data.pop("member_ids", [])
        group = super().create(validated_data)

        group_memberships = [
            GroupMembership(group=group, user_id=member_id, created_by=self.context["current_user"])
            for member_id in member_ids
        ]
        GroupMembership.objects.bulk_create(group_memberships)

        return group
