# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Models for constraint interventions (e.g., road blocks)."""

import uuid
from typing import ClassVar

from django.contrib.gis.db import models


class ConstraintInterventionType(models.Model):
    """Type of constraint intervention (e.g., Road blocks)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    impacts_routing = models.BooleanField(default=True)

    def __str__(self):
        """Return the string representation of the model."""
        return self.name


class ConstraintIntervention(models.Model):
    """User-drawn constraint intervention (e.g., road block polygon or segment).

    Scoped to: user + scenario (NOT focus area).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(
        "Scenario",
        on_delete=models.CASCADE,
        related_name="constraint_interventions",
    )
    user_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField(srid=4326)
    type = models.ForeignKey(
        ConstraintInterventionType,
        on_delete=models.CASCADE,
        related_name="constraint_interventions",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["created_at"]

    def __str__(self):
        """Return the string representation of the model."""
        return f"{self.name} ({self.type.name})"
