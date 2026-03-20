# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Models for resource interventions (e.g., sandbag deployments)."""

import uuid
from typing import ClassVar

from django.contrib.gis.db import models

from api.models.scenario import Scenario


class ResourceInterventionType(models.Model):
    """Type of resource intervention (e.g., Sandbags)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    unit = models.CharField(max_length=50)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["name"]

    def __str__(self):
        """Return the string representation of the model."""
        return f"{self.name} ({self.unit})"


class ResourceInterventionLocation(models.Model):
    """Physical location where resources are stored, scoped to scenario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(
        Scenario, on_delete=models.CASCADE, related_name="resource_intervention_locations"
    )
    name = models.CharField(max_length=255)
    geometry = models.PointField(srid=4326)
    type = models.ForeignKey(
        ResourceInterventionType,
        on_delete=models.CASCADE,
        related_name="locations",
    )
    current_stock = models.IntegerField(default=0)
    max_capacity = models.IntegerField(default=300)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["name"]
        indexes: ClassVar = [
            models.Index(fields=["scenario", "name"], name="resource_loc_scenario_name_idx"),
        ]
        constraints: ClassVar = [
            models.CheckConstraint(
                condition=models.Q(current_stock__gte=0),
                name="resource_location_stock_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(current_stock__lte=models.F("max_capacity")),
                name="resource_location_stock_within_capacity",
            ),
            models.CheckConstraint(
                condition=models.Q(max_capacity__gt=0),
                name="resource_location_capacity_positive",
            ),
        ]

    def __str__(self):
        """Return the string representation of the model."""
        return f"{self.name} ({self.current_stock}/{self.max_capacity} {self.type.unit})"


class ResourceInterventionAction(models.Model):
    """Audit trail record for stock changes (withdrawals and restocks)."""

    ACTION_TYPES: ClassVar = [
        ("withdraw", "Withdraw"),
        ("restock", "Restock"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = models.ForeignKey(
        ResourceInterventionLocation,
        on_delete=models.CASCADE,
        related_name="actions",
    )
    user_id = models.UUIDField(db_index=True)
    action_type = models.CharField(max_length=10, choices=ACTION_TYPES)
    quantity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["-created_at"]
        indexes: ClassVar = [
            models.Index(fields=["location", "-created_at"], name="resource_action_location_idx"),
            models.Index(fields=["user_id", "-created_at"], name="resource_action_user_idx"),
        ]
        constraints: ClassVar = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="action_quantity_positive",
            ),
        ]

    def __str__(self):
        """Return the string representation of the model."""
        return f"{self.action_type.title()} {self.quantity} at {self.location.name}"
