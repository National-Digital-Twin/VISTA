"""Scenario model."""

import uuid

from django.db import models


class Scenario(models.Model):
    """Scenario model representing a planning scenario."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField()

    def __str__(self):
        """Return string representation."""
        return self.name
