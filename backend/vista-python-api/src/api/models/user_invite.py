# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""User Invite model."""

from typing import ClassVar
from uuid import uuid4

from django.contrib.gis.db import models
from django.utils import timezone


class UserInvite(models.Model):
    """UserInvite model."""

    ACCEPTED = "accepted"
    EXPIRED = "expired"
    PENDING = "pending"

    USER_INVITE_STATUSES: ClassVar[list[tuple[str, str]]] = [
        (PENDING, "Pending"),
        (ACCEPTED, "Accepted"),
        (EXPIRED, "Expired"),
    ]

    id = models.UUIDField(default=uuid4, unique=True, primary_key=True)
    user_id = models.UUIDField(unique=True)
    status = models.CharField(max_length=20, choices=USER_INVITE_STATUSES, default="pending")
    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True)
    expired_at = models.DateTimeField(null=True)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["created_at"]

    @classmethod
    def create(cls, user_id, status, created_by):
        """Create an instance."""
        return cls(
            id=uuid4(),
            user_id=user_id,
            status=status,
            created_by=created_by,
            created_at=timezone.now(),
        )

    def __str__(self):
        """UserInvite string representation."""
        return ""
