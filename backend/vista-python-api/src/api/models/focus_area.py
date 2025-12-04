"""Focus Area model."""

import uuid
from typing import ClassVar

from django.contrib.gis.db import models

from .scenario import Scenario


class FocusArea(models.Model):
    """Focus Area model representing a user's area of interest within a scenario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name="focus_areas")
    user_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField(srid=4326)
    is_active = models.BooleanField()

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["name"]

    def __str__(self):
        """Return string representation."""
        return f"{self.name} ({self.scenario.name})"
