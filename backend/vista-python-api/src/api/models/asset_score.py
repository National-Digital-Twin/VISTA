"""Models concerning asset scores within a scenario for each user."""

from django.contrib.gis.db import models


class AssetScore(models.Model):
    """AssetScore model."""

    id = models.UUIDField(primary_key=True)
    scenario_id = models.UUIDField()
    user_id = models.UUIDField()
    criticality_score = models.DecimalField(max_digits=10, decimal_places=2)
    dependency_score = models.DecimalField(max_digits=10, decimal_places=2)
    exposure_score = models.DecimalField(max_digits=10, decimal_places=2)
    redundancy_score = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        """Meta configuration."""

        managed = False
        db_table = "asset_scores"
