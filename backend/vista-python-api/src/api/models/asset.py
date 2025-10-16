"""Asset model."""

import uuid

from django.contrib.gis.db import models

from .asset_type import AssetType


class Asset(models.Model):
    """Asset model."""

    id = models.UUIDField(unique=True, primary_key=True)
    name = models.CharField(max_length=255, blank=True)
    type = models.ForeignKey(AssetType, on_delete=models.CASCADE)
    geom = models.GeometryField()

    @classmethod
    def create(cls, name, asset_type, geom):
        """Create an instance."""
        return cls(id=uuid.uuid4(), name=name, type=asset_type, geom=geom)

    def __str__(self):
        """Asset string representation."""
        return f"{self.name} ({self.type}) at {self.geom}"
