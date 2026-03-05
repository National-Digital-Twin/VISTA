# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Per-asset criticality score override model."""

import uuid
from typing import ClassVar

from django.db import models

from .asset import Asset
from .scenario import Scenario


class AssetCriticalityOverride(models.Model):
    """Per-asset override of the type-level criticality score within a scenario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(
        Scenario, on_delete=models.CASCADE, related_name="criticality_overrides"
    )
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="criticality_overrides")
    criticality_score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField()
    updated_by = models.UUIDField()

    class Meta:
        """Meta configuration."""

        constraints: ClassVar = [
            models.UniqueConstraint(
                fields=["scenario", "asset"],
                name="unique_scenario_asset_criticality_override",
            ),
            models.CheckConstraint(
                condition=models.Q(criticality_score__gte=0, criticality_score__lte=3),
                name="criticality_score_range_0_3",
            ),
        ]

    def __str__(self):
        """Return the string representation of the model."""
        return f"Override for {self.asset} in {self.scenario}: {self.criticality_score}"
