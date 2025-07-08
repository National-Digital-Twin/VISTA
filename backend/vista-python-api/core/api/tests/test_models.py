"""Tests for models, mostly __str__ method coverage."""

from decimal import Decimal

import pytest
from model_bakery import baker

from api import models


@pytest.mark.django_db
def test_sandbag_placement():
    """Test SandbagPlacement.__str__."""
    assert f"{baker.make(models.SandbagPlacement, name="example")}" == "example"


@pytest.mark.django_db
def test_sandbag_float_to_decimal():
    """Test that a float lat/lon gets quantized."""
    sandbag = baker.make(models.SandbagPlacement)
    sandbag.latitude = 60.123456789123456789
    sandbag.longitude = -1.123456789123456789
    sandbag.save()
    assert sandbag.latitude == Decimal("60.123456")
    assert sandbag.longitude == Decimal("-1.123456")


@pytest.mark.django_db
def test_sandbag_decimal_to_decimal():
    """Test that a decimal lat/lon gets quantized."""
    sandbag = baker.make(models.SandbagPlacement)
    sandbag.latitude = Decimal("60.123456789123456789")
    sandbag.longitude = Decimal("-1.123456789123456789")
    sandbag.save()
    assert sandbag.latitude == Decimal("60.123456")
    assert sandbag.longitude == Decimal("-1.123456")


@pytest.mark.django_db
def test_sandbag_str_to_decimal():
    """Test that a str lat/lon gets quantized."""
    sandbag = baker.make(models.SandbagPlacement)
    sandbag.latitude = "60.123456789123456789"
    sandbag.longitude = "-1.123456789123456789"
    sandbag.save()
    assert sandbag.latitude == Decimal("60.123456")
    assert sandbag.longitude == Decimal("-1.123456")


@pytest.mark.django_db
def test_traffic_data():
    """Test TrafficData.__str__."""
    assert (
        f"{
            baker.make(
                models.TrafficData,
                site_name="site name",
                day_of_week="Friday",
                hour="01:00:00.0000",
                direction="up"
            )
        }"
        == "site name - Friday 01:00:00.0000 up"
    )


@pytest.mark.django_db
def test_vulerable_person():
    """Test VulnerablePerson.__str__."""
    assert (
        f"{
            baker.make(
                models.VulnerablePerson,
                mock_first_name="ExampleFirstName",
                mock_last_name="ExampleLastName",
                mock_year_of_birth=1991,
            )
        }"
        == "ExampleFirstName ExampleLastName 1991"
    )


@pytest.mark.django_db
def test_low_bridge():
    """Test LowBridge.__str__."""
    assert (
        f"{
            baker.make(
                models.LowBridge,
                name="example name",
                dimension_in=984,
                height_meters=2.5,
                latitude=60.0,
                longitude=-1.2,
            )
        }"
        == "example name (2.5m) at 60.0, -1.2"
    )


@pytest.mark.django_db
def test_narrow_road():
    """Test NarrowRoad.__str__."""
    assert (
        f"{
            baker.make(
                models.NarrowRoad,
                name="example name",
                dimension_in=984,
                width_meters=2.5,
                latitude=60.0,
                longitude=-1.2,
            )
        }"
        == "example name (2.5m) at 60.0, -1.2"
    )
