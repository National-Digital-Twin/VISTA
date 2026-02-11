"""Serializers for DataSource model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import DataSource, Group, GroupDataSourceAccess


class GroupDataSourceAccessSerializer(serializers.ModelSerializer):
    """Simple serializer for group data source access updates."""

    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), error_messages={"does_not_exist": "Related object not found."}
    )

    class Meta:
        """Configuration for the `GroupDataSourceAccessSerializer`."""

        model = GroupDataSourceAccess
        fields: ClassVar[list[str]] = ["group", "data_source_id"]


class GroupDataSourceSerializer(serializers.ModelSerializer):
    """Simple serializer for including groups with access in data source response."""

    class Meta:
        """Configuration for the `GroupDataSourceSerializer`."""

        model = Group
        fields: ClassVar[list[str]] = ["id", "name", "members"]


class DataSourceSerializer(serializers.ModelSerializer):
    """Serializer for the DataSource model."""

    asset_count = serializers.IntegerField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)
    description = serializers.CharField(source="description_md")
    groups_with_access = serializers.SerializerMethodField()
    globally_available = serializers.SerializerMethodField()

    class Meta:
        """Configuration for the `DataSourceSerializer`."""

        model = DataSource
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "owner",
            "description",
            "asset_count",
            "last_updated",
            "globally_available",
            "groups_with_access",
        ]

    def get_groups_with_access(self, obj):
        """Get a list of groups with access to the data source."""
        group_members = obj.group_accesses.select_related("group").prefetch_related(
            "group__members"
        )
        return GroupDataSourceSerializer(
            [group_member.group for group_member in group_members], many=True
        ).data

    def get_globally_available(self, obj):
        """Get whether the data source is globally available."""
        return obj.globally_available
