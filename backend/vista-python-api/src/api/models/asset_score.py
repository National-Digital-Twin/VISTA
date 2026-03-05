# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Models concerning asset scores within a scenario."""

from django.contrib.gis.db import models

from api.models.asset import Asset


class AssetScore(models.Model):
    """Asset score model (criticality, dependency, redundancy only).

    Note: exposure_score is not included here because it varies by focus area.
    Query VisibleExposureAssetScore separately with a focus_area_id filter.
    """

    asset = models.OneToOneField(
        Asset,
        primary_key=True,
        db_column="id",
        on_delete=models.DO_NOTHING,
        related_name="asset_scores_view",
    )
    scenario_id = models.UUIDField()
    criticality_score = models.DecimalField(max_digits=10, decimal_places=2)
    dependency_score = models.DecimalField(max_digits=10, decimal_places=2)
    redundancy_score = models.DecimalField(max_digits=10, decimal_places=2)
    criticality_is_overridden = models.BooleanField()

    class Meta:
        """Meta configuration."""

        managed = False
        db_table = "asset_scores"


class VisibleExposureAssetScore(models.Model):
    """Exposure score per asset, scoped to a specific focus area (backed by database view)."""

    asset_id = models.UUIDField(primary_key=True)
    user_id = models.UUIDField(null=True)
    scenario_id = models.UUIDField()
    focus_area_id = models.UUIDField()
    score = models.IntegerField()

    class Meta:
        """Meta configuration."""

        managed = False
        db_table = "visible_exposure_asset_scores"
