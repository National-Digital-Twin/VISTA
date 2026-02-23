"""Models for geographic exposure layers."""

import uuid
from typing import ClassVar

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

    APPROVED = "approved"
    PENDING = "pending"
    UNPUBLISHED = "unpublished"

    EXPOSURE_LAYER_STATUSES: ClassVar[list[tuple[str, str]]] = [
        (APPROVED, "Approved"),
        (PENDING, "Pending"),
        (UNPUBLISHED, "Unpublished"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    geometry = models.GeometryField()
    geometry_buffered = models.GeometryField()
    status = models.CharField(max_length=20, choices=EXPOSURE_LAYER_STATUSES, default=UNPUBLISHED)
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
    approved_by = models.UUIDField(null=True, blank=True)
    rejected_by = models.UUIDField(null=True, blank=True)
    removed_by = models.UUIDField(null=True, blank=True)
    published_id_int = models.IntegerField(null=True, blank=True, unique=True)

    def __str__(self) -> str:
        """Return the string representation of the model."""
        return self.name

    @property
    def is_user_defined(self) -> bool:
        """Return True if this is a user-defined exposure layer."""
        return self.user_id is not None

    @property
    def is_editable(self) -> bool:
        """Return True if layer is editable."""
        return self.type.is_user_editable and self.status == self.UNPUBLISHED

    @property
    def is_ready_for_admin_review(self) -> bool:
        """Return True if layer is ready for approval or rejection."""
        return self.type.is_user_editable and self.status == self.PENDING

    @property
    def is_ready_for_admin_removal(self) -> bool:
        """Return True if layer is ready for removal."""
        return self.type.is_user_editable and self.status == self.APPROVED

    @property
    def published_id(self) -> str | None:
        """Return the formatted published ID, or None if not published."""
        return (
            f"UD.{self.published_id_int}"
            if self.published_id_int and self.is_ready_for_admin_removal
            else None
        )
