"""Tests for the scenarios endpoint."""

import uuid

import pytest

from api.models import Scenario

http_success_code = 200
http_not_found = 404


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

    assert response.status_code == http_success_code
    assert len(data) == len(scenarios)
    names = [s["name"] for s in data]
    assert "Test Scenario 1" in names
    assert "Test Scenario 2" in names
    assert "Inactive Scenario" in names


@pytest.mark.django_db
def test_retrieve_scenario(scenarios, client):
    """Test retrieving a single scenario."""
    scenario = scenarios[1]  # The active scenario
    response = client.get(f"/api/scenarios/{scenario.id}/")
    data = response.json()

    assert response.status_code == http_success_code
    assert data["name"] == scenario.name
    assert data["isActive"] is True


@pytest.mark.django_db
def test_retrieve_inactive_scenario(scenarios, client):
    """Test retrieving an inactive scenario."""
    inactive = scenarios[2]
    response = client.get(f"/api/scenarios/{inactive.id}/")
    data = response.json()

    assert response.status_code == http_success_code
    assert data["name"] == inactive.name
    assert data["isActive"] is False


@pytest.mark.django_db
def test_retrieve_nonexistent_scenario_returns_404(client):
    """Test that nonexistent scenarios return 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/")
    assert response.status_code == http_not_found
