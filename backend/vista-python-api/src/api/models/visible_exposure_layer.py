"""Visible Exposure Layer model."""

import uuid
from typing import ClassVar

from django.db import models

from .exposure_layer import ExposureLayer
from .focus_area import FocusArea
from .scenario import Scenario


class VisibleExposureLayer(models.Model):
    """Tracks which exposure layers are visible for a user within a scenario/focus area.

    Row existence indicates visibility. To hide an exposure layer, delete the row.
    focus_area_id = NULL indicates map-wide/global visibility.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(
        Scenario, on_delete=models.CASCADE, related_name="visible_exposure_layers"
    )
    user_id = models.UUIDField(db_index=True)
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.CASCADE,
        related_name="visible_exposure_layers",
        null=True,
        blank=True,
    )
    exposure_layer = models.ForeignKey(
        ExposureLayer, on_delete=models.CASCADE, related_name="visible_in"
    )

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["scenario", "user_id", "focus_area", "exposure_layer"],
                name="unique_visible_exposure_layer",
            )
        ]

    def __str__(self):
        """Return string representation."""
        area = self.focus_area.name if self.focus_area else "Map-wide"
        return f"{self.exposure_layer.name} visible in {area} ({self.scenario.name})"
