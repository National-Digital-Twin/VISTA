"""vista Backend Models."""

from django.db import models


class TrafficData(models.Model):
    """Traffic data model."""

    site_name = models.CharField(max_length=255)
    day_of_week = models.CharField(max_length=10)
    hour = models.TimeField()
    direction = models.CharField(max_length=255)
    volume = models.IntegerField(null=True, blank=True)  # Allow null values
    busyness = models.IntegerField(null=True, blank=True)
    average_speed = models.IntegerField(null=True, blank=True)  # Allow null values
    coordinates = models.CharField(max_length=255, blank=True)

    class Meta:
        """Fields that are unique together."""

        unique_together = ("site_name", "day_of_week", "hour", "direction", "coordinates")

    def __str__(self):
        """Traffic Data String Representation."""
        return f"{self.site_name} - {self.day_of_week} {self.hour} {self.direction}"


class LowBridge(models.Model):
    """Low Bridge model."""

    local_id = models.CharField(max_length=50, unique=True)
    dimension_in = models.IntegerField()  # height in inches (deprecated)
    height_meters = models.FloatField()
    direction = models.CharField(max_length=50, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        """Low Bridge String Representation."""
        return f"{self.name} ({self.height_meters:.1f}m) at {self.latitude}, {self.longitude}"


class NarrowRoad(models.Model):
    """Narrow Road model."""

    local_id = models.CharField(max_length=50, unique=True)
    dimension_in = models.IntegerField()  # width in inches (deprecated)
    width_meters = models.FloatField()
    direction = models.CharField(max_length=50, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        """Narrow Road String Representation."""
        return f"{self.name} ({self.width_meters:.1f}m) at {self.latitude}, {self.longitude}"
