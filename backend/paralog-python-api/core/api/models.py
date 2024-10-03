"""Paralog Backend Models."""

from decimal import ROUND_DOWN, Decimal

from django.db import models


class SandbagPlacement(models.Model):
    """Create SandbagPlacement as a named geographic point."""

    name = models.TextField(unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        """Sandbag Placement Location."""
        return self.name

    def save(self, *args, **kwargs):
        """Ensure latitude and longitude have correct precision."""

        def to_decimal(v):
            if isinstance(v, Decimal):
                return v

            if isinstance(v, float):
                return Decimal(str(v))

            return Decimal(v)

        def quantize(v):
            return to_decimal(v).quantize(Decimal("1.000000"), rounding=ROUND_DOWN)

        self.latitude = quantize(self.latitude)
        self.longitude = quantize(self.longitude)
        super().save(*args, **kwargs)


class TrafficData(models.Model):
    """Traffic data model."""

    site_name = models.CharField(max_length=255)
    day_of_week = models.CharField(max_length=10)
    hour = models.TimeField()
    direction = models.CharField(max_length=255)
    volume = models.IntegerField(null=True, blank=True)  # Allow null values
    busyness = models.IntegerField(null=True, blank=True)
    average_speed = models.IntegerField(null=True, blank=True)  # Allow null values
    coordinates = models.CharField(max_length=255, null=True, blank=True)  # noqa: DJ001

    class Meta:
        """Fields that are unique together."""

        unique_together = ("site_name", "day_of_week", "hour", "direction", "coordinates")

    def __str__(self):
        """Traffic Data String Representation."""
        return f"{self.site_name} - {self.day_of_week} {self.hour} {self.direction}"


class VulnerablePerson(models.Model):
    """Vulnerable Person model."""

    mock_individual_index = models.CharField(max_length=255)
    mock_property_index = models.CharField(max_length=255)
    mock_first_name = models.CharField(max_length=255)
    mock_last_name = models.CharField(max_length=255)
    mock_sex = models.CharField(max_length=50)
    mock_year_of_birth = models.IntegerField()
    mock_disability = models.CharField(max_length=255)
    mock_asc_primary_support_reason = models.CharField(max_length=255)
    mock_address_line1 = models.CharField(max_length=255)
    mock_alert_category = models.CharField(max_length=255)
    mock_alert_detail = models.CharField(max_length=255)
    uprn = models.CharField(max_length=255)
    postcode_locator = models.CharField(max_length=50)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        """Vulnerable Person String Representation."""
        return f"{self.mock_first_name} {self.mock_last_name} {self.mock_year_of_birth}"

    @property
    def mock_address_line_1(self):
        """Fix camelCase rewrite of mockAddressLine1."""
        return self.mock_address_line1


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
