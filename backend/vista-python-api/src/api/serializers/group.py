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
        fields: ClassVar[list[str]] = ["name", "group_id", "user_id", "created_at", "created_by"]
        read_only_fields: ClassVar[list[str]] = ["created_at", "created_by"]
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
        child=serializers.CharField(), write_only=True, required=False
    )
    created_by = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the serializer."""

        model = Group
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "created_at",
            "created_by",
            "members",
            "member_ids",
        ]
        read_only_fields: ClassVar[list[str]] = ["created_at", "created_by"]

    def get_created_by(self, obj):
        """Get name of user who created group from serializer context."""
        user = self.context["idp_user_map"].get(str(obj.created_by))
        if user:
            return user.name
        return "Unknown user"

    def validate(self, attrs):
        """Validate expected request attributes are present."""
        request = self.context.get("request")

        if request and request.method == "POST" and "member_ids" not in attrs:
            raise serializers.ValidationError(
                {"member_ids": "This field is required when creating a group."}
            )

        return attrs

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
