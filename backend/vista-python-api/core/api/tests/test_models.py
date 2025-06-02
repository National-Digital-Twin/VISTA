"""Tests for models, mostly __str__ method coverage."""


import pytest
from model_bakery import baker

from api import models


@pytest.mark.django_db()
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


@pytest.mark.django_db()
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


@pytest.mark.django_db()
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
