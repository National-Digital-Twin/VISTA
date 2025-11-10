"""Models concerning data provenance."""

import uuid
from django.db import models

class DataSource(models.Model):
    """Data source model."""

    id = models.UUIDField(unique=True, primary_key=True)
    name = models.CharField(max_length=256)
    owner = models.CharField(max_length=256)

    def __str__(self):
        """DataSource string representation."""
        return self.name
