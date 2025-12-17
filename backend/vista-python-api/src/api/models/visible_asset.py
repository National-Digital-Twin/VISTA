"""Visible Asset model."""

import uuid
from typing import ClassVar

from django.db import models

from .asset_type import AssetType
from .focus_area import FocusArea


class VisibleAsset(models.Model):
    """Tracks which asset types are visible within a focus area scope.

    Row existence indicates visibility. To hide an asset type, delete the row.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.CASCADE,
        related_name="visible_assets",
    )
    asset_type = models.ForeignKey(AssetType, on_delete=models.CASCADE, related_name="visible_in")

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["focus_area", "asset_type"],
                name="unique_visible_asset",
            )
        ]

    def __str__(self):
        """Return string representation."""
        return f"{self.asset_type.name} visible in {self.focus_area.name}"
