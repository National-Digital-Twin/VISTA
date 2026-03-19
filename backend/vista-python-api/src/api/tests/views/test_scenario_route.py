# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the scenario route endpoint."""

import uuid

import pytest
from django.contrib.gis.geos import LineString
from rest_framework import status

from api.models import Scenario
from api.models.road_link import Directionality, RoadLink
from api.routing import routing_cache


@pytest.fixture
def scenario():
    """Create a test scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


@pytest.fixture
def road_network():
    """Create a simple road network for testing routes."""
    RoadLink.objects.create(
        osid="link1",
        geometry=LineString([(-1.0, 50.0), (-1.1, 50.0)], srid=4326),
        length_m=1000,
        directionality=Directionality.BOTH,
        start_node="node_a",
        end_node="node_b",
        speed_limit_mph=30,
        operational_state="Open",
    )
    RoadLink.objects.create(
        osid="link2",
        geometry=LineString([(-1.1, 50.0), (-1.2, 50.0)], srid=4326),
        length_m=1000,
        directionality=Directionality.BOTH,
        start_node="node_b",
        end_node="node_c",
        speed_limit_mph=30,
        operational_state="Open",
    )
    routing_cache.invalidate()


@pytest.mark.django_db
def test_route_nonexistent_scenario_returns_404(client):
    """Test that requesting a route for nonexistent scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.post(
        f"/api/scenarios/{fake_id}/route/",
        data={
            "start_lat": 50.0,
            "start_lon": -1.0,
            "end_lat": 50.0,
            "end_lon": -1.2,
        },
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_route_missing_params_returns_400(scenario, client):
    """Test that missing parameters return 400."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/route/",
        data={"start_lat": 50.0},
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.usefixtures("road_network")
def test_route_returns_geojson(scenario, client):
    """Test that a valid request returns GeoJSON."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/route/",
        data={
            "start_lat": 50.0,
            "start_lon": -1.0,
            "end_lat": 50.0,
            "end_lon": -1.2,
        },
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert "properties" in data


@pytest.mark.django_db
@pytest.mark.usefixtures("road_network")
def test_route_with_vehicle_param(scenario, client):
    """Test that vehicle parameter is accepted."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/route/",
        data={
            "start_lat": 50.0,
            "start_lon": -1.0,
            "end_lat": 50.0,
            "end_lon": -1.2,
            "vehicle": "HGV",
        },
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_route_invalid_coordinates_returns_400(scenario, client):
    """Latitude outside valid range should return 400."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/route/",
        data={
            "start_lat": 91.0,
            "start_lon": -1.0,
            "end_lat": 50.0,
            "end_lon": -1.2,
        },
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.usefixtures("road_network")
def test_route_includes_runtime_seconds(scenario, client):
    """Response properties should include runtimeSeconds."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/route/",
        data={
            "start_lat": 50.0,
            "start_lon": -1.0,
            "end_lat": 50.0,
            "end_lon": -1.2,
        },
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "runtimeSeconds" in data["properties"]
    assert isinstance(data["properties"]["runtimeSeconds"], float)
