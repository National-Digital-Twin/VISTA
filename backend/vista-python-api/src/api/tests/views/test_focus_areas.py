"""Tests for the focus-areas endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario

http_success_code = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_not_found = 404


@pytest.fixture
def focus_areas(db, scenario, mock_user_id):  # noqa: ARG001
    """Create test focus areas for the mock dev user."""
    geom1 = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    geom2 = GEOSGeometry("POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))")

    area1 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 1",
        geometry=geom1,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    area2 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 2",
        geometry=geom2,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    return [area1, area2]


@pytest.mark.django_db
def test_list_focus_areas_includes_mapwide(scenario, client):
    """Test listing focus areas auto-creates and includes map-wide."""
    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 1  # Just map-wide

    # Map-wide should be first (due to ordering by -is_system)
    mapwide = data[0]
    assert mapwide["name"] == "Map-wide"
    assert mapwide["geometry"] is None
    assert mapwide["isSystem"] is True
    assert mapwide["isActive"] is True
    assert mapwide["filterMode"] == "by_asset_type"


@pytest.mark.django_db
def test_list_focus_areas_with_user_areas(focus_areas, scenario, client):  # noqa: ARG001
    """Test listing focus areas returns map-wide + user areas."""
    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/")
    data = response.json()

    assert response.status_code == http_success_code
    # Map-wide (auto-created) + 2 user focus areas
    assert len(data) == 3

    # Map-wide should be first
    assert data[0]["name"] == "Map-wide"
    assert data[0]["isSystem"] is True

    # User areas follow
    names = [f["name"] for f in data[1:]]
    assert "Area 1" in names
    assert "Area 2" in names


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
    assert data["isSystem"] is False
    assert data["isActive"] is True
    assert data["filterMode"] == "by_asset_type"


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
    assert data["isSystem"] is False


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
def test_update_focus_area_filter_mode(focus_areas, scenario, client):
    """Test updating focus area filter mode."""
    area = focus_areas[0]
    response = client.patch(
        f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/",
        data=json.dumps({"filterMode": "by_score_only"}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["filterMode"] == "by_score_only"


@pytest.mark.django_db
def test_update_focus_area_is_active(focus_areas, scenario, client):
    """Test updating focus area is_active."""
    area = focus_areas[0]
    response = client.patch(
        f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/",
        data=json.dumps({"isActive": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False


@pytest.mark.django_db
def test_update_mapwide_filter_mode(scenario, mock_user_id, client):
    """Test updating map-wide filter mode."""
    # First, trigger map-wide creation
    client.get(f"/api/scenarios/{scenario.id}/focus-areas/")

    mapwide = FocusArea.objects.get(scenario=scenario, user_id=mock_user_id, is_system=True)
    response = client.patch(
        f"/api/scenarios/{scenario.id}/focus-areas/{mapwide.id}/",
        data=json.dumps({"filterMode": "by_score_only", "isActive": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["filterMode"] == "by_score_only"
    assert data["isActive"] is False
    # Name should not change even if attempted
    assert data["name"] == "Map-wide"


@pytest.mark.django_db
def test_delete_focus_area(focus_areas, scenario, client):
    """Test deleting a focus area."""
    area = focus_areas[0]
    response = client.delete(f"/api/scenarios/{scenario.id}/focus-areas/{area.id}/")

    assert response.status_code == http_no_content
    assert not FocusArea.objects.filter(id=area.id).exists()


@pytest.mark.django_db
def test_cannot_delete_mapwide(scenario, mock_user_id, client):
    """Test that map-wide focus area cannot be deleted."""
    # Trigger map-wide creation
    client.get(f"/api/scenarios/{scenario.id}/focus-areas/")

    mapwide = FocusArea.objects.get(scenario=scenario, user_id=mock_user_id, is_system=True)
    response = client.delete(f"/api/scenarios/{scenario.id}/focus-areas/{mapwide.id}/")

    assert response.status_code == http_bad_request
    assert FocusArea.objects.filter(id=mapwide.id).exists()


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
        is_system=False,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/focus-areas/")
    data = response.json()

    assert response.status_code == http_success_code
    # Should only see map-wide (auto-created for current user)
    assert len(data) == 1
    assert data[0]["name"] == "Map-wide"


@pytest.mark.django_db
def test_focus_area_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/focus-areas/")
    assert response.status_code == http_not_found
