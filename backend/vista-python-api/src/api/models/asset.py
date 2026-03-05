# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Asset model."""

import uuid

from django.contrib.gis.db import models
from django.utils import timezone

from .asset_type import AssetType


class Asset(models.Model):
    """Asset model."""

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True)
    external_id = models.CharField(max_length=255, unique=True, blank=True, default=None)
    name = models.CharField(max_length=255, blank=True)
    type = models.ForeignKey(AssetType, related_name="assets", on_delete=models.CASCADE)
    geom = models.GeometryField()
    last_updated = models.DateTimeField(null=True)

    @classmethod
    def create(cls, external_id, name, asset_type, geom):
        """Create an instance."""
        return cls(
            id=uuid.uuid4(),
            external_id=external_id,
            name=name,
            type=asset_type,
            geom=geom,
            last_updated=timezone.now(),
        )

    def __str__(self):
        """Asset string representation."""
        return f"{self.name} ({self.type}) at {self.geom}"
