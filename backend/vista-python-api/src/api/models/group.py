# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Group model."""

import uuid
from typing import ClassVar
from uuid import uuid4

from django.contrib.gis.db import models
from django.utils import timezone

from api.models.data_source import DataSource


class Group(models.Model):
    """Group model."""

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.UUIDField()

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["created_at"]

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

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True)
    data_source = models.ForeignKey(
        DataSource, on_delete=models.CASCADE, related_name="group_accesses"
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    created_by = models.UUIDField(null=True)

    def __str__(self):
        """Group data source access string representation."""
        return f"{self.group} is given access to {self.data_source}"


class GroupMembership(models.Model):
    """Group membership access model."""

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    user_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.UUIDField()

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["created_at"]
        constraints: ClassVar = [
            models.UniqueConstraint(
                fields=["group", "user_id"],
                name="unique_membership_per_user",
            )
        ]

    @classmethod
    def create(cls, group_id, user_id, created_by):
        """Create an instance."""
        return cls(
            group_id=group_id,
            user_id=user_id,
            created_by=created_by,
            created_at=timezone.now(),
        )

    def __str__(self):
        """Group membership string representation."""
        return f"User with id {self.user_id} belongs to {self.group}"
