"""Group model."""

from uuid import uuid4

from django.contrib.gis.db import models
from django.utils import timezone

from api.models.data_source import DataSource


class Group(models.Model):
    """Group model."""

    id = models.UUIDField(unique=True, primary_key=True)
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(null=True)
    created_by = models.UUIDField()

    @classmethod
    def create(cls, name, created_by):
        """Create an instance."""
        return cls(
            id=uuid4(),
            name=name,
            created_by=created_by,
            created_at=timezone.now(),
        )

    def __str__(self):
        """Group string representation."""
        return self.name


class GroupDataSourceAccess(models.Model):
    """Group data source access model."""

    id = models.UUIDField(unique=True, primary_key=True)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    def __str__(self):
        """Group data source access string representation."""
        return f"{self.group} is given access to {self.data_source}"


class GroupMembership(models.Model):
    """Group membership access model."""

    id = models.UUIDField(unique=True, primary_key=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    user_id = models.UUIDField()
    created_at = models.DateTimeField(null=True)
    created_by = models.UUIDField()

    @classmethod
    def create(cls, group_id, user_id, created_by):
        """Create an instance."""
        return cls(
            id=uuid4(),
            group=group_id,
            user_id=user_id,
            created_by=created_by,
            created_at=timezone.now(),
        )

    def __str__(self):
        """Group membership string representation."""
        return f"User with id {self.user_id} belongs to {self.group}"
