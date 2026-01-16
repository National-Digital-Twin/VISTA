"""Models concerning asset scores within a scenario."""

from django.contrib.gis.db import models


class AssetScore(models.Model):
    """Asset score model (criticality, dependency, redundancy only).

    Note: exposure_score is not included here because it varies by focus area.
    Query VisibleExposureAssetScore separately with a focus_area_id filter.
    """

    id = models.UUIDField(primary_key=True)
    scenario_id = models.UUIDField()
    criticality_score = models.DecimalField(max_digits=10, decimal_places=2)
    dependency_score = models.DecimalField(max_digits=10, decimal_places=2)
    redundancy_score = models.DecimalField(max_digits=10, decimal_places=2)

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
