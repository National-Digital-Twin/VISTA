"""Visible Asset model."""

import uuid
from typing import ClassVar

from django.db import models

from .asset_type import AssetType
from .focus_area import FocusArea
from .scenario import Scenario


class VisibleAsset(models.Model):
    """Tracks which asset types are visible for a user within a scenario/focus area.

    Row existence indicates visibility. To hide an asset type, delete the row.
    focus_area_id = NULL indicates map-wide/global visibility.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name="visible_assets")
    user_id = models.UUIDField(db_index=True)
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.CASCADE,
        related_name="visible_assets",
        null=True,
        blank=True,
    )
    asset_type = models.ForeignKey(AssetType, on_delete=models.CASCADE, related_name="visible_in")

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["scenario", "user_id", "focus_area", "asset_type"],
                name="unique_visible_asset",
            )
        ]

    def __str__(self):
        """Return string representation."""
        area = self.focus_area.name if self.focus_area else "Map-wide"
        return f"{self.asset_type.name} visible in {area} ({self.scenario.name})"
