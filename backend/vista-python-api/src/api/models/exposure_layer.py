"""Models for geographic exposure layers."""

import uuid
from django.contrib.gis.db import models

class ExposureLayer(models.Model):
    """
    Represents a geographic exposure layer, such as a water body.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField()

    def __str__(self):
        return self.name
