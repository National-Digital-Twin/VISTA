# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Scenario model."""

import uuid
from typing import ClassVar

from django.db import models
from django.db.models import Q


class Scenario(models.Model):
    """Scenario model representing a planning scenario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField()
    code = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["code", "name"]
        constraints: ClassVar = [
            models.UniqueConstraint(
                fields=["is_active"],
                condition=Q(is_active=True),
                name="only_one_active_entity",
            )
        ]

    def __str__(self):
        """Return string representation."""
        return self.name
