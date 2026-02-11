"""Models concerning data provenance."""

import uuid

from django.db import models


class DataSource(models.Model):
    """Data source model."""

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True)
    name = models.CharField(max_length=256)
    owner = models.CharField(max_length=256)
    description_md = models.TextField(default="")

    def __str__(self):
        """DataSource string representation."""
        return self.name

    @property
    def globally_available(self):
        """Is not limited by group accesses."""
        return self.group_accesses.count() == 0
