"""Models for geographic exposure layers."""

import uuid

from django.contrib.gis.db import models


class ExposureLayerType(models.Model):
    """Represents the type of an exposure layer, such as a flood."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    impacts_exposure_score = models.BooleanField(default=True)
    is_user_editable = models.BooleanField(default=False)

    def __str__(self):
        """Return the string representation of the model."""
        return self.name


class ExposureLayer(models.Model):
    """Represents a geographic exposure layer, such as a water body."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField()
    geometry_buffered = models.GeometryField()
    type = models.ForeignKey(
        ExposureLayerType,
        on_delete=models.CASCADE,
        related_name="exposure_layers",
        default="2d373dca-1337-4e60-ba08-c8326d27042d",
    )
    # User-defined exposure layer fields (null for system layers)
    user_id = models.UUIDField(null=True, blank=True, db_index=True)
    scenario = models.ForeignKey(
        "Scenario",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="user_exposure_layers",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        """Return the string representation of the model."""
        return self.name

    @property
    def is_user_defined(self):
        """Return True if this is a user-defined exposure layer."""
        return self.user_id is not None
