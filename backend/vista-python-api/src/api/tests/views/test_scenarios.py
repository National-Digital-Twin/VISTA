"""Tests for the scenarios endpoint."""

import json
import uuid

import pytest
from rest_framework import status

from api.models import Scenario


@pytest.fixture
def scenarios(db):  # noqa: ARG001
    """Create sample scenarios."""
    scenario1 = Scenario.objects.create(name="Test Scenario 1", is_active=False)
    scenario2 = Scenario.objects.create(name="Test Scenario 2", is_active=True)
    scenario3 = Scenario.objects.create(name="Inactive Scenario", is_active=False)
    return [scenario1, scenario2, scenario3]


@pytest.mark.django_db
def test_list_scenarios(scenarios, client):
    """Test that all scenarios are listed."""
    response = client.get("/api/scenarios/")
    data = response.json()

    assert response.status_code == status.HTTP_200_OK
    assert len(data) == len(scenarios)
    names = [s["name"] for s in data]
    assert "Test Scenario 1" in names
    assert "Test Scenario 2" in names
    assert "Inactive Scenario" in names


@pytest.mark.django_db
def test_list_scenarios_includes_pending_exposure_count(scenarios, client):  # noqa: ARG001
    """Test that each scenario in the list includes pendingExposureCount."""
    response = client.get("/api/scenarios/")
    data = response.json()

    assert response.status_code == status.HTTP_200_OK
    for scenario_data in data:
        assert "pendingExposureCount" in scenario_data
        assert isinstance(scenario_data["pendingExposureCount"], int)
        assert scenario_data["pendingExposureCount"] >= 0


@pytest.mark.django_db
def test_retrieve_scenario(scenarios, client):
    """Test retrieving a single scenario."""
    scenario = scenarios[1]
    response = client.get(f"/api/scenarios/{scenario.id}/")
    data = response.json()

    assert response.status_code == status.HTTP_200_OK
    assert data["name"] == scenario.name
    assert data["isActive"] is True


@pytest.mark.django_db
def test_retrieve_inactive_scenario(scenarios, client):
    """Test retrieving an inactive scenario."""
    inactive = scenarios[2]
    response = client.get(f"/api/scenarios/{inactive.id}/")
    data = response.json()

    assert response.status_code == status.HTTP_200_OK
    assert data["name"] == inactive.name
    assert data["isActive"] is False


@pytest.mark.django_db
def test_retrieve_nonexistent_scenario_returns_404(client):
    """Test that nonexistent scenarios return 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_activate_scenario_returns_204(scenarios, client):
    """Test toggling scenario is_active."""
    scenario = scenarios[0]
    previously_active_scenario = scenarios[1]

    response = client.post(
        f"/api/scenarios/{scenario.id}/activate/",
        content_type="application/json",
    )
    active_scenario = Scenario.objects.filter(is_active=True)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert len(active_scenario) == 1
    assert active_scenario[0].id == scenario.id
    assert active_scenario[0].id != previously_active_scenario.id


@pytest.mark.django_db
def test_activate_already_active_scenario_returns_204(scenarios, client):
    """Test toggling scenario is_active."""
    scenario = scenarios[1]

    response = client.post(
        f"/api/scenarios/{scenario.id}/activate/",
        content_type="application/json",
    )
    active_scenario = Scenario.objects.filter(is_active=True)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert len(active_scenario) == 1
    assert active_scenario[0].id == scenario.id


@pytest.mark.django_db
def test_activate_non_existent_scenario_returns_404(scenarios, client):  # noqa: ARG001
    """Test toggling scenario is_active."""
    response = client.post(
        f"/api/scenarios/{uuid.uuid4()}/activate/",
        content_type="application/json",
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
