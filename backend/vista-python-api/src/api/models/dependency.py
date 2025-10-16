"""Dependency model."""

import uuid

from django.contrib.gis.db import models

from .asset import Asset


class Dependency(models.Model):
    """Dependency model."""

    id = models.UUIDField(unique=True, default=uuid.uuid4, primary_key=True)
    provider_asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="provider")
    dependent_asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="dependent")

    @classmethod
    def create(cls, provider_asset, dependent_asset):
        """Create an instance."""
        return cls(id=uuid.uuid4(), provider_asset=provider_asset, dependent_asset=dependent_asset)

    def __str__(self):
        """Dependent string representation."""
        return f"{self.dependent_asset} depends on {self.provider_asset}"
