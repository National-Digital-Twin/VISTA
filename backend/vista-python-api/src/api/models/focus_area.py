"""Focus Area model."""

import uuid
from typing import ClassVar

from django.contrib.gis.db import models

from .scenario import Scenario


class FocusArea(models.Model):
    """Focus Area model representing a filtering scope within a scenario.

    Can be either:
    - A user-defined geographic polygon (is_system=False, geometry is set)
    - The map-wide scope (is_system=True, geometry=NULL)
    """

    FILTER_MODE_CHOICES: ClassVar[list[tuple[str, str]]] = [
        ("by_asset_type", "By asset type"),
        ("by_score_only", "By VISTA score"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name="focus_areas")
    user_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField(srid=4326, null=True)
    filter_mode = models.CharField(
        max_length=20, choices=FILTER_MODE_CHOICES, default="by_asset_type"
    )
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration."""

        ordering: ClassVar[list[str]] = ["-is_system", "created_at"]

    def __str__(self):
        """Return string representation."""
        return f"{self.name} ({self.scenario.name})"
