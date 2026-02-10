"""Visible Resource Intervention Type model."""

import uuid
from typing import ClassVar

from django.db import models

from .resource_intervention import ResourceInterventionType
from .scenario import Scenario


class VisibleResourceInterventionType(models.Model):
    """Tracks which resource intervention types are visible for a user in a scenario.

    Row existence indicates visibility. To hide a resource type, delete the row.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.CASCADE,
        related_name="visible_resource_intervention_types",
    )
    resource_intervention_type = models.ForeignKey(
        ResourceInterventionType,
        on_delete=models.CASCADE,
        related_name="visible_in",
    )

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["user_id", "scenario", "resource_intervention_type"],
                name="unique_visible_resource_intervention_type",
            )
        ]

    def __str__(self):
        """Return the string representation of the model."""
        return (
            f"{self.resource_intervention_type.name} visible for user"
            f" {self.user_id} in scenario {self.scenario.id}"
        )
