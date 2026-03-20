# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for constraint interventions."""

import json
import time
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import Scenario
from api.models.constraint_intervention import ConstraintIntervention, ConstraintInterventionType

SAMPLE_POLYGON = [[[0.1, 0.1], [0.1, 0.5], [0.5, 0.5], [0.5, 0.1], [0.1, 0.1]]]
SAMPLE_POLYGON_2 = [[[0.4, 0.4], [0.4, 0.6], [0.6, 0.6], [0.6, 0.4], [0.4, 0.4]]]
SAMPLE_LINESTRING = [[0.1, 0.1], [0.5, 0.5]]

http_success_code = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_not_found = 404


@pytest.fixture
def road_blocks_type(db):  # noqa: ARG001
    """Get or create road blocks constraint intervention type."""
    intervention_type, _ = ConstraintInterventionType.objects.get_or_create(
        id=uuid.UUID("cc413844-4577-4926-9478-2855785d506d"),
        defaults={"name": "Road blocks"},
    )
    return intervention_type


def find_intervention_in_tree(data, intervention_id):
    """Find an intervention in the data tree."""
    intervention_id_str = str(intervention_id)
    for intervention_type in data:
        for intervention in intervention_type.get("constraintInterventions", []):
            if intervention["id"] == intervention_id_str:
                return intervention
    return None


def find_type_by_name(data, name):
    """Find a constraint intervention type by name."""
    for intervention_type in data:
        if intervention_type["name"] == name:
            return intervention_type
    return None


# --- GET (List) Tests ---


@pytest.mark.django_db
def test_list_interventions_empty(scenario, road_blocks_type, client):  # noqa: ARG001
    """Test that GET returns types with empty interventions list."""
    response = client.get(f"/api/scenarios/{scenario.id}/constraint-interventions/")
    data = response.json()

    assert response.status_code == http_success_code
    road_blocks = find_type_by_name(data, "Road blocks")
    assert road_blocks is not None
    assert road_blocks["constraintInterventions"] == []


@pytest.mark.django_db
def test_list_interventions_with_data(scenario, mock_user_id, road_blocks_type, client):
    """Test that GET returns user's interventions grouped by type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Test Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/constraint-interventions/")
    data = response.json()

    assert response.status_code == http_success_code

    intervention_data = find_intervention_in_tree(data, intervention.id)
    assert intervention_data is not None
    assert intervention_data["name"] == "Test Block"
    assert intervention_data["isActive"] is True
    assert "geometry" in intervention_data
    assert "createdAt" in intervention_data
    assert "updatedAt" in intervention_data


@pytest.mark.django_db
def test_list_interventions_ordered_by_created_at(scenario, mock_user_id, road_blocks_type, client):
    """Test that interventions are ordered by created_at."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")

    intervention1 = ConstraintIntervention.objects.create(
        name="First",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    time.sleep(0.01)
    intervention2 = ConstraintIntervention.objects.create(
        name="Second",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/constraint-interventions/")
    data = response.json()

    road_blocks = find_type_by_name(data, "Road blocks")
    interventions = road_blocks["constraintInterventions"]

    assert len(interventions) == 2
    assert interventions[0]["id"] == str(intervention1.id)
    assert interventions[1]["id"] == str(intervention2.id)


@pytest.mark.django_db
def test_list_interventions_user_isolation(scenario, mock_user_id, road_blocks_type, client):
    """Test that users can only see their own interventions."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_intervention = ConstraintIntervention.objects.create(
        name="My Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    other_user_id = uuid.uuid4()
    other_intervention = ConstraintIntervention.objects.create(
        name="Other Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=other_user_id,
        scenario=scenario,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/constraint-interventions/")
    data = response.json()

    user_data = find_intervention_in_tree(data, user_intervention.id)
    assert user_data is not None

    other_data = find_intervention_in_tree(data, other_intervention.id)
    assert other_data is None


@pytest.mark.django_db
def test_list_interventions_scenario_isolation(scenario, mock_user_id, road_blocks_type, client):
    """Test that interventions are scoped to scenario."""
    other_scenario = Scenario.objects.create(name="Other Scenario", is_active=False)

    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    ConstraintIntervention.objects.create(
        name="Other Scenario Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=other_scenario,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/constraint-interventions/")
    data = response.json()

    road_blocks = find_type_by_name(data, "Road blocks")
    assert road_blocks is not None
    assert len(road_blocks["constraintInterventions"]) == 0


@pytest.mark.django_db
def test_list_interventions_invalid_scenario_404(client):
    """Test that invalid scenario returns 404."""
    response = client.get(f"/api/scenarios/{uuid.uuid4()}/constraint-interventions/")
    assert response.status_code == http_not_found


# --- POST (Create) Tests ---


@pytest.mark.django_db
def test_create_intervention_with_polygon(scenario, road_blocks_type, client):
    """Test creating an intervention with polygon geometry."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps(
            {
                "type_id": str(road_blocks_type.id),
                "geometry": geometry,
                "name": "Custom Block",
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created, f"Got: {data}"
    assert data["name"] == "Custom Block"
    assert data["geometry"] == geometry
    assert data["isActive"] is True
    assert "id" in data
    assert "createdAt" in data
    assert "updatedAt" in data

    intervention = ConstraintIntervention.objects.get(id=data["id"])
    assert intervention.type == road_blocks_type
    assert intervention.user_id is not None
    assert intervention.scenario == scenario


@pytest.mark.django_db
def test_create_intervention_with_linestring(scenario, road_blocks_type, client):
    """Test creating an intervention with linestring geometry."""
    geometry = {"type": "LineString", "coordinates": SAMPLE_LINESTRING}

    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps(
            {
                "type_id": str(road_blocks_type.id),
                "geometry": geometry,
                "name": "Road Segment Block",
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created, f"Got: {data}"
    assert data["geometry"]["type"] == "LineString"


@pytest.mark.django_db
def test_create_intervention_auto_generates_name(scenario, road_blocks_type, client):
    """Test that name is auto-generated when not provided."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response1 = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps({"type_id": str(road_blocks_type.id), "geometry": geometry}),
        content_type="application/json",
    )
    assert response1.status_code == http_created
    assert response1.json()["name"] == "Road block 1"

    response2 = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps({"type_id": str(road_blocks_type.id), "geometry": geometry}),
        content_type="application/json",
    )
    assert response2.status_code == http_created
    assert response2.json()["name"] == "Road block 2"


@pytest.mark.django_db
def test_create_intervention_requires_type_id(scenario, client):
    """Test that type_id is required."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}
    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps({"geometry": geometry, "name": "Missing Type"}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert "typeId" in response.json()


@pytest.mark.django_db
def test_create_intervention_requires_geometry(scenario, road_blocks_type, client):
    """Test that geometry is required."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps({"type_id": str(road_blocks_type.id), "name": "Missing Geometry"}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert "geometry" in response.json()


@pytest.mark.django_db
def test_create_intervention_invalid_type_404(scenario, client):
    """Test that invalid type_id returns 404."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps({"type_id": str(uuid.uuid4()), "geometry": geometry}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_create_intervention_invalid_geometry(scenario, road_blocks_type, client):
    """Test that invalid geometry returns error."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/constraint-interventions/",
        data=json.dumps(
            {
                "type_id": str(road_blocks_type.id),
                "geometry": {"type": "Invalid", "coordinates": []},
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_create_intervention_invalid_scenario_404(road_blocks_type, client):
    """Test that invalid scenario returns 404."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{uuid.uuid4()}/constraint-interventions/",
        data=json.dumps({"type_id": str(road_blocks_type.id), "geometry": geometry}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


# --- PATCH (Update) Tests ---


@pytest.mark.django_db
def test_update_intervention_name(scenario, mock_user_id, road_blocks_type, client):
    """Test renaming an intervention."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Original Name",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/",
        data=json.dumps({"name": "New Name"}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["name"] == "New Name"

    intervention.refresh_from_db()
    assert intervention.name == "New Name"


@pytest.mark.django_db
def test_update_intervention_geometry(scenario, mock_user_id, road_blocks_type, client):
    """Test updating geometry of an intervention."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Test Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    new_geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON_2}

    response = client.patch(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/",
        data=json.dumps({"geometry": new_geometry}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["geometry"] == new_geometry


@pytest.mark.django_db
def test_update_intervention_is_active(scenario, mock_user_id, road_blocks_type, client):
    """Test toggling is_active."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Test Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
        is_active=True,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/",
        data=json.dumps({"is_active": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False

    intervention.refresh_from_db()
    assert intervention.is_active is False


@pytest.mark.django_db
def test_cannot_update_other_users_intervention(scenario, road_blocks_type, client):
    """Test that users cannot update other users' interventions."""
    other_user_id = uuid.uuid4()
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Other User Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=other_user_id,
        scenario=scenario,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/",
        data=json.dumps({"name": "Hacked Name"}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_update_intervention_invalid_id_404(scenario, client):
    """Test that invalid intervention ID returns 404."""
    response = client.patch(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{uuid.uuid4()}/",
        data=json.dumps({"name": "New Name"}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


# --- DELETE Tests ---


@pytest.mark.django_db
def test_delete_intervention(scenario, mock_user_id, road_blocks_type, client):
    """Test deleting an intervention."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="To Delete",
        geometry=geom,
        type=road_blocks_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    intervention_id = intervention.id

    response = client.delete(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/"
    )

    assert response.status_code == http_no_content
    assert not ConstraintIntervention.objects.filter(id=intervention_id).exists()


@pytest.mark.django_db
def test_cannot_delete_other_users_intervention(scenario, road_blocks_type, client):
    """Test that users cannot delete other users' interventions."""
    other_user_id = uuid.uuid4()
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    intervention = ConstraintIntervention.objects.create(
        name="Other User Block",
        geometry=geom,
        type=road_blocks_type,
        user_id=other_user_id,
        scenario=scenario,
    )

    response = client.delete(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{intervention.id}/"
    )

    assert response.status_code == http_not_found
    assert ConstraintIntervention.objects.filter(id=intervention.id).exists()


@pytest.mark.django_db
def test_delete_intervention_invalid_id_404(scenario, client):
    """Test that invalid intervention ID returns 404."""
    response = client.delete(
        f"/api/scenarios/{scenario.id}/constraint-interventions/{uuid.uuid4()}/"
    )

    assert response.status_code == http_not_found
