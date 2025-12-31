"""Serializers for DataSource model."""

from typing import ClassVar

from rest_framework import serializers

from api.models import DataSource


class DataSourceSerializer(serializers.ModelSerializer):
    """Serializer for the DataSource model."""

    asset_count = serializers.IntegerField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)
    description = serializers.CharField(source="description_md")

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
        ]
