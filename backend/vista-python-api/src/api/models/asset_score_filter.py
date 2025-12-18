"""Asset Score Filter model."""

import uuid
from typing import ClassVar

from django.contrib.postgres.fields import ArrayField
from django.db import models

from .asset_type import AssetType
from .focus_area import FocusArea


class AssetScoreFilter(models.Model):
    """Stores score filter configuration per focus area scope.

    When asset_type is NULL, this represents a global "By VISTA score" mode filter.
    When asset_type is set, this represents a per-type filter in "By asset type" mode.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.CASCADE,
        related_name="asset_score_filters",
    )
    asset_type = models.ForeignKey(
        AssetType,
        on_delete=models.CASCADE,
        related_name="score_filters",
        null=True,
    )

    # Score filter values - NULL means no filter for that score type
    criticality_values = ArrayField(models.IntegerField(), null=True)
    exposure_values = ArrayField(models.IntegerField(), null=True)
    redundancy_values = ArrayField(models.IntegerField(), null=True)
    dependency_min = models.DecimalField(max_digits=4, decimal_places=2, null=True)
    dependency_max = models.DecimalField(max_digits=4, decimal_places=2, null=True)

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["focus_area", "asset_type"],
                name="unique_asset_score_filter",
            )
        ]

    def __str__(self):
        """Return string representation."""
        type_str = self.asset_type.name if self.asset_type else "Global"
        return f"Score filter for {type_str} in {self.focus_area.name}"
