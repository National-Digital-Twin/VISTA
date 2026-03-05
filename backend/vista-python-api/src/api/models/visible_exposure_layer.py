# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Visible Exposure Layer model."""

import uuid
from typing import ClassVar

from django.db import models

from .exposure_layer import ExposureLayer
from .focus_area import FocusArea


class VisibleExposureLayer(models.Model):
    """Tracks which exposure layers are visible within a focus area scope.

    Row existence indicates visibility. To hide an exposure layer, delete the row.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    focus_area = models.ForeignKey(
        FocusArea,
        on_delete=models.CASCADE,
        related_name="visible_exposure_layers",
    )
    exposure_layer = models.ForeignKey(
        ExposureLayer, on_delete=models.CASCADE, related_name="visible_in"
    )

    class Meta:
        """Meta configuration."""

        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=["focus_area", "exposure_layer"],
                name="unique_visible_exposure_layer",
            )
        ]

    def __str__(self):
        """Return string representation."""
        return f"{self.exposure_layer.name} visible in {self.focus_area.name}"
