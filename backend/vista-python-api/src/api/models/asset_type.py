"""Models concerning taxonomy of assets."""

from django.contrib.gis.db import models

from .data_source import DataSource


class AssetCategory(models.Model):
    """Asset Category model."""

    id = models.UUIDField(unique=True, primary_key=True)
    name = models.CharField(max_length=256)

    def __str__(self):
        """AssetType string representation."""
        return self.name


class AssetSubCategory(models.Model):
    """Asset Sub-category model."""

    id = models.UUIDField(unique=True, primary_key=True)
    category_id = models.ForeignKey(
        AssetCategory, on_delete=models.CASCADE, related_name="sub_categories"
    )
    name = models.CharField(max_length=256)

    def __str__(self):
        """AssetType string representation."""
        return self.name


class AssetType(models.Model):
    """Asset Type model."""

    id = models.UUIDField(unique=True, primary_key=True)
    sub_category_id = models.ForeignKey(
        AssetSubCategory, on_delete=models.CASCADE, related_name="asset_types"
    )
    data_source_id = models.ForeignKey(
        DataSource, related_name="types", on_delete=models.CASCADE, null=True
    )
    name = models.CharField(max_length=256)

    def __str__(self):
        """AssetType string representation."""
        return self.name
