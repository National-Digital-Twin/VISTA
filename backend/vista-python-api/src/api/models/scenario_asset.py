# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Scenario model."""

import uuid

from django.db import models

from .asset_type import AssetType
from .scenario import Scenario


class ScenarioAsset(models.Model):
    """ScenarioAsset model."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(
        Scenario, on_delete=models.CASCADE, related_name="asset_type_scores"
    )
    asset_type = models.ForeignKey(
        AssetType, on_delete=models.CASCADE, related_name="scenario_scores"
    )
    criticality_score = models.IntegerField()

    def __str__(self):
        """Return string representation."""
        return (
            f"{self.asset_type} in {self.scenario} has criticality score {self.criticality_score}"
        )
