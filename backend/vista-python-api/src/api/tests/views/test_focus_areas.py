"""Tests for the focus-areas endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario

http_success_code = 200
http_created = 201
http_no_content = 204
http_not_found = 404


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create a test scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


@pytest.fixture
def focus_areas(db, scenario):  # noqa: ARG001
    """Create test focus areas for the mock dev user."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    geom1 = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    geom2 = GEOSGeometry("POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))")

    area1 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 1",
        geometry=geom1,
        is_active=True,
    )
    area2 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 2",
        geometry=geom2,
        is_active=True,
    )
    return [area1, area2]


@pytest.mark.django_db
def test_list_focus_areas(focus_areas, scenario, client):
    """Test listing focus areas returns array with geometry as GeoJSON."""
    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == len(focus_areas)

    names = [f["name"] for f in data]
    assert "Area 1" in names
    assert "Area 2" in names

    for item in data:
        assert "geometry" in item
        assert item["geometry"]["type"] == "Polygon"


@pytest.mark.django_db
def test_create_focus_area_with_polygon(scenario, client):
    """Test creating a focus area with polygon geometry."""
    polygon = {"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
    response = client.post(
        f"/api/scenarios/{scenario.id}/focus-areas/",
        data=json.dumps({"geometry": polygon, "name": "My Area"}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created
    assert data["name"] == "My Area"
    assert data["geometry"]["type"] == "Polygon"
    assert data["geometry"]["coordinates"] == polygon["coordinates"]


@pytest.mark.django_db
def test_create_focus_area_auto_generates_name(scenario, client):
    """Test that name is auto-generated if not provided."""
    polygon = {"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
    response = client.post(
        f"/api/scenarios/{scenario.id}/focus-areas/",
        data=json.dumps({"geometry": polygon}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created
    assert data["name"] == "Area 1"


@pytest.mark.django_db
def test_retrieve_focus_area(focus_areas, scenario, client):
    """Test retrieving a single focus area."""
    area = focus_areas[0]
    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/")
    data = response.json()

    assert response.status_code == http_success_code
    assert data["name"] == "Area 1"
    assert data["geometry"]["type"] == "Polygon"


@pytest.mark.django_db
def test_update_focus_area_name(focus_areas, scenario, client):
    """Test updating focus area name."""
    area = focus_areas[0]
    response = client.patch(
        f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/",
        data=json.dumps({"name": "Renamed Area"}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["name"] == "Renamed Area"


@pytest.mark.django_db
def test_update_focus_area_is_active(focus_areas, scenario, client):
    """Test toggling focus area is_active."""
    area = focus_areas[0]
    response = client.patch(
        f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/",
        data=json.dumps({"is_active": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False


@pytest.mark.django_db
def test_delete_focus_area(focus_areas, scenario, client):
    """Test deleting a focus area."""
    area = focus_areas[0]
    response = client.delete(f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/")

    assert response.status_code == http_no_content
    assert not FocusArea.objects.filter(id=area.id).exists()


@pytest.mark.django_db
def test_focus_area_user_isolation(scenario, client, db):  # noqa: ARG001
    """Test that users only see their own focus areas."""
    other_user_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    FocusArea.objects.create(
        scenario=scenario,
        user_id=other_user_id,
        name="Other User Area",
        geometry=geom,
        is_active=True,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_focus_area_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/focus-areas/")
    assert response.status_code == http_not_found
