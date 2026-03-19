# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for models, mostly __str__ method coverage."""

import pytest
from model_bakery import baker

from api.arch_models import NarrowRoad, TrafficData


@pytest.mark.django_db
def test_traffic_data():
    """Test TrafficData.__str__."""
    assert (
        f"{
            baker.make(
                TrafficData,
                site_name='site name',
                day_of_week='Friday',
                hour='01:00:00.0000',
                direction='up',
            )
        }"
        == "site name - Friday 01:00:00.0000 up"
    )


@pytest.mark.django_db
def test_narrow_road():
    """Test NarrowRoad.__str__."""
    assert (
        f"{
            baker.make(
                NarrowRoad,
                name='example name',
                dimension_in=984,
                width_meters=2.5,
                latitude=60.0,
                longitude=-1.2,
            )
        }"
        == "example name (2.5m) at 60.0, -1.2"
    )
