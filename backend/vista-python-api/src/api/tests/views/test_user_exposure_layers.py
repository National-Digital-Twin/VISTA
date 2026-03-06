# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for user-defined exposure layers."""

import json
import time
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType
from api.tests.conftest import buffer_geometry

SAMPLE_POLYGON = [[[0.1, 0.1], [0.1, 0.5], [0.5, 0.5], [0.5, 0.1], [0.1, 0.1]]]
SAMPLE_POLYGON_2 = [[[0.4, 0.4], [0.4, 0.6], [0.6, 0.6], [0.6, 0.4], [0.4, 0.4]]]

http_ok = 200
http_created = 201
http_no_content = 204
http_bad_request = 400
http_forbidden = 403
http_not_found = 404


@pytest.fixture
def user_drawn_type(db):  # noqa: ARG001
    """Create a user-editable exposure layer type for testing."""
    return ExposureLayerType.objects.create(
        id=uuid.uuid4(),
        name="Test User Editable",
        impacts_exposure_score=True,
        is_user_editable=True,
    )


@pytest.fixture
def non_editable_type(db):  # noqa: ARG001
    """Create a non-user-editable exposure layer type for testing."""
    return ExposureLayerType.objects.create(
        id=uuid.uuid4(),
        name="Test Non Editable",
        impacts_exposure_score=True,
        is_user_editable=False,
    )


@pytest.fixture
def focus_area(db, scenario, mock_user_id):  # noqa: ARG001
    """Create a sample focus area."""
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    return FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Area",
        geometry=geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )


def find_exposure_layer_in_tree(data, exposure_layer_id):
    """Find an exposure layer in the data tree."""
    exposure_layer_id_str = str(exposure_layer_id)
    for exposure_layer_type in data:
        for exposure_layer in exposure_layer_type.get("exposureLayers", []):
            if exposure_layer["id"] == exposure_layer_id_str:
                return exposure_layer
    return None


def find_type_by_name(data, name):
    """Find an exposure layer type by name."""
    for exposure_layer_type in data:
        if exposure_layer_type["name"] == name:
            return exposure_layer_type
    return None


class Administrator:
    """Mock administrator permission."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return whether user has permission."""
        return False


# --- GET (List) Tests ---


@pytest.mark.django_db
def test_list_exposure_layers_includes_user_drawn(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test that GET returns user-drawn layers in 'User drawn' type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_ok

    user_drawn_type_data = find_type_by_name(data, "Test User Editable")
    assert user_drawn_type_data is not None
    assert user_drawn_type_data["isUserEditable"] is True

    user_layer_data = find_exposure_layer_in_tree(data, user_layer.id)
    assert user_layer_data is not None
    assert user_layer_data["name"] == "My User Layer"
    assert user_layer_data["isUserDefined"] is True
    assert user_layer_data["status"] == ExposureLayer.UNPUBLISHED
    assert "geometry" in user_layer_data
    assert "createdAt" in user_layer_data
    assert "publishedId" in user_layer_data


@pytest.mark.django_db
def test_list_exposure_layers_gives_correct_status_for_non_editable_layer_type(
    scenario, non_editable_type, client
):
    """Test that GET returns correct status (null) for non-editable layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
    data = response.json()

    assert response.status_code == http_ok

    user_layer_data = find_exposure_layer_in_tree(data, layer.id)
    assert user_layer_data is not None
    assert user_layer_data["status"] is None


@pytest.mark.django_db
def test_list_exposure_layers_user_isolation(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test that users cannot see other users' unpublished or pending layers."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    other_user_id = uuid.uuid4()
    other_unpublished = ExposureLayer.objects.create(
        name="Other Unpublished",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )
    other_pending = ExposureLayer.objects.create(
        name="Other Pending",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert find_exposure_layer_in_tree(data, user_layer.id) is not None
    assert find_exposure_layer_in_tree(data, other_unpublished.id) is None
    assert find_exposure_layer_in_tree(data, other_pending.id) is None


@pytest.mark.django_db
def test_list_exposure_layers_shows_other_users_approved_layers(
    scenario, focus_area, user_drawn_type, client
):
    """Test that approved layers from other users are visible."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    other_user_id = uuid.uuid4()
    other_approved = ExposureLayer.objects.create(
        name="Other Approved",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
        published_id_int=1,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    layer_data = find_exposure_layer_in_tree(data, other_approved.id)
    assert layer_data is not None
    assert layer_data["name"] == "Other Approved"
    assert layer_data["isUserDefined"] is True
    assert layer_data["status"] == ExposureLayer.APPROVED
    assert layer_data["publishedId"] == "UD.1"


@pytest.mark.django_db
def test_list_exposure_layers_scenario_isolation(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test that user-drawn layers are scoped to scenario."""
    other_scenario = Scenario.objects.create(name="Other Scenario", is_active=False)

    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    ExposureLayer.objects.create(
        name="Other Scenario Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=other_scenario,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    user_drawn_type_data = find_type_by_name(data, "Test User Editable")
    assert user_drawn_type_data is not None
    assert len(user_drawn_type_data["exposureLayers"]) == 0


@pytest.mark.django_db
def test_list_exposure_layers_ordered_by_created_at(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test that user-drawn layers are ordered by created_at."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")

    layer1 = ExposureLayer.objects.create(
        name="First",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    time.sleep(0.01)
    layer2 = ExposureLayer.objects.create(
        name="Second",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    user_drawn_type_data = find_type_by_name(data, "Test User Editable")
    layers = user_drawn_type_data["exposureLayers"]

    assert len(layers) == 2
    assert layers[0]["id"] == str(layer1.id)
    assert layers[1]["id"] == str(layer2.id)


@pytest.mark.django_db
def test_list_exposure_layers_returns_is_user_editable(scenario, focus_area, client):
    """Test that exposure layer types include isUserEditable field."""
    system_type = ExposureLayerType.objects.create(
        id=uuid.uuid4(),
        name="System Floods",
        is_user_editable=False,
    )
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    ExposureLayer.objects.create(
        name="Flood Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_ok

    system_type_data = find_type_by_name(data, "System Floods")
    assert system_type_data is not None
    assert system_type_data["isUserEditable"] is False

    user_drawn_type_data = find_type_by_name(data, "User drawn")
    assert user_drawn_type_data is not None
    assert user_drawn_type_data["isUserEditable"] is True


@pytest.mark.django_db
def test_get_exposure_layers_no_active_focus_areas(scenario, mock_user_id, client):
    """Test GET without focus_area_id when user has no active focus areas."""
    FocusArea.objects.filter(scenario=scenario, user_id=mock_user_id).update(is_active=False)

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Test Type")
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Test Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=system_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
    data = response.json()

    assert response.status_code == http_ok
    test_type = find_type_by_name(data, "Test Type")
    assert test_type is not None
    for layer in test_type["exposureLayers"]:
        assert layer["isActive"] is False


# --- GET focusAreaRelation Tests ---


@pytest.mark.django_db
def test_exposure_layers_returns_all_layers_not_just_intersecting(scenario, mock_user_id, client):
    """Test that ALL layers are returned, including those outside the focus area."""
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Test Floods")

    inside_geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    inside_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Inside Layer",
        geometry=inside_geom,
        geometry_buffered=buffer_geometry(inside_geom),
        type=system_type,
    )

    outside_geom = GEOSGeometry("POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))")
    outside_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Outside Layer",
        geometry=outside_geom,
        geometry_buffered=buffer_geometry(outside_geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_ok

    inside_layer_data = find_exposure_layer_in_tree(data, inside_layer.id)
    outside_layer_data = find_exposure_layer_in_tree(data, outside_layer.id)

    assert inside_layer_data is not None, "Inside layer should be returned"
    assert outside_layer_data is not None, "Outside layer should also be returned"


@pytest.mark.django_db
def test_exposure_layers_focus_area_relation_contained(scenario, mock_user_id, client):
    """Test that layers fully inside focus area have focusAreaRelation='contained'."""
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Contained Type")

    contained_geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.8, 0.8 0.8, 0.8 0.2, 0.2 0.2))")
    contained_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Contained Layer",
        geometry=contained_geom,
        geometry_buffered=buffer_geometry(contained_geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    layer_data = find_exposure_layer_in_tree(data, contained_layer.id)
    assert layer_data is not None
    assert layer_data["focusAreaRelation"] == "contained"


@pytest.mark.django_db
def test_exposure_layers_focus_area_relation_overlaps(scenario, mock_user_id, client):
    """Test that layers partially overlapping have focusAreaRelation='overlaps'."""
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Overlaps Type")

    overlaps_geom = GEOSGeometry("POLYGON((0.5 0.5, 0.5 1.5, 1.5 1.5, 1.5 0.5, 0.5 0.5))")
    overlaps_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Overlaps Layer",
        geometry=overlaps_geom,
        geometry_buffered=buffer_geometry(overlaps_geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    layer_data = find_exposure_layer_in_tree(data, overlaps_layer.id)
    assert layer_data is not None
    assert layer_data["focusAreaRelation"] == "overlaps"


@pytest.mark.django_db
def test_exposure_layers_focus_area_relation_elsewhere(scenario, mock_user_id, client):
    """Test that layers outside focus area have focusAreaRelation='elsewhere'."""
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Elsewhere Type")

    elsewhere_geom = GEOSGeometry("POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))")
    elsewhere_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Elsewhere Layer",
        geometry=elsewhere_geom,
        geometry_buffered=buffer_geometry(elsewhere_geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    layer_data = find_exposure_layer_in_tree(data, elsewhere_layer.id)
    assert layer_data is not None
    assert layer_data["focusAreaRelation"] == "elsewhere"


@pytest.mark.django_db
def test_exposure_layers_map_wide_all_contained(scenario, mock_user_id, client):
    """Test that map-wide focus areas (null geometry) return all layers as 'contained'."""
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Map Wide",
        geometry=None,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="MapWide Type")

    geom = GEOSGeometry("POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))")
    layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Any Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=system_type,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    layer_data = find_exposure_layer_in_tree(data, layer.id)
    assert layer_data is not None
    assert layer_data["focusAreaRelation"] == "contained"


@pytest.mark.django_db
def test_all_active_focus_areas_no_spatial_relation(scenario, mock_user_id, client):
    """Test that multi-focus-area mode returns null focusAreaRelation (not calculated)."""
    fa1_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 1",
        geometry=fa1_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    fa2_geom = GEOSGeometry("POLYGON((10 10, 10 11, 11 11, 11 10, 10 10))")
    FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Area 2",
        geometry=fa2_geom,
        filter_mode="by_asset_type",
        is_active=True,
    )

    system_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="MultiArea Type")

    contained_geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.8, 0.8 0.8, 0.8 0.2, 0.2 0.2))")
    contained_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Contained in A1",
        geometry=contained_geom,
        geometry_buffered=buffer_geometry(contained_geom),
        type=system_type,
    )

    elsewhere_geom = GEOSGeometry("POLYGON((50 50, 50 51, 51 51, 51 50, 50 50))")
    elsewhere_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(),
        name="Outside Both",
        geometry=elsewhere_geom,
        geometry_buffered=buffer_geometry(elsewhere_geom),
        type=system_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
    data = response.json()

    contained_data = find_exposure_layer_in_tree(data, contained_layer.id)
    elsewhere_data = find_exposure_layer_in_tree(data, elsewhere_layer.id)

    assert contained_data is not None
    assert contained_data["focusAreaRelation"] is None

    assert elsewhere_data is not None
    assert elsewhere_data["focusAreaRelation"] is None


# --- POST (create) Tests ---


@pytest.mark.django_db
def test_create_user_exposure_layer_with_polygon(scenario, user_drawn_type, client):
    """Test creating a user-drawn exposure layer with polygon geometry."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps(
            {
                "type_id": str(user_drawn_type.id),
                "geometry": geometry,
                "name": "My Custom Layer",
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created, f"Got: {data}"
    assert data["name"] == "My Custom Layer"
    assert data["geometry"] == geometry
    assert data["isUserDefined"] is True
    assert data["status"] == ExposureLayer.UNPUBLISHED
    assert "id" in data
    assert "createdAt" in data

    layer = ExposureLayer.objects.get(id=data["id"])
    assert layer.type == user_drawn_type
    assert layer.user_id is not None
    assert layer.scenario == scenario


@pytest.mark.django_db
def test_create_user_exposure_layer_auto_generates_name(scenario, user_drawn_type, client):
    """Test that name is auto-generated as 'Exposure N' when not provided."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response1 = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(user_drawn_type.id), "geometry": geometry}),
        content_type="application/json",
    )
    assert response1.status_code == http_created
    assert response1.json()["name"] == "Exposure 1"

    response2 = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(user_drawn_type.id), "geometry": geometry}),
        content_type="application/json",
    )
    assert response2.status_code == http_created
    assert response2.json()["name"] == "Exposure 2"


@pytest.mark.django_db
def test_create_user_exposure_layer_auto_enables_visibility(
    scenario, focus_area, user_drawn_type, client
):
    """Test that focus_area_id enables visibility automatically."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps(
            {
                "type_id": str(user_drawn_type.id),
                "geometry": geometry,
                "focus_area_id": str(focus_area.id),
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created, f"Got: {data}"
    assert data["isActive"] is True

    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer_id=data["id"]
    ).exists()


@pytest.mark.django_db
def test_create_user_exposure_layer_without_focus_area_not_visible(
    scenario, user_drawn_type, client
):
    """Test that layer is not automatically visible when focusAreaId not provided."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(user_drawn_type.id), "geometry": geometry}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_created
    assert data["isActive"] is False


@pytest.mark.django_db
def test_create_user_exposure_layer_requires_type_id(scenario, client):
    """Test that typeId is required."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}
    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"geometry": geometry, "name": "Missing Type"}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert "typeId" in response.json()


@pytest.mark.django_db
def test_create_user_exposure_layer_requires_geometry(scenario, user_drawn_type, client):
    """Test that geometry is required."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(user_drawn_type.id), "name": "Missing Geometry"}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert "geometry" in response.json()


@pytest.mark.django_db
def test_create_user_exposure_layer_invalid_geometry(scenario, user_drawn_type, client):
    """Test that invalid geometry returns error."""
    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps(
            {
                "type_id": str(user_drawn_type.id),
                "geometry": {"type": "Invalid", "coordinates": []},
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_create_user_exposure_layer_invalid_type_not_found(scenario, client):
    """Test that creating layer with invalid type ID returns 404."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(uuid.uuid4()), "geometry": geometry}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_create_user_exposure_layer_non_editable_type_forbidden(
    scenario, non_editable_type, client
):
    """Test that creating layer with is_user_editable=False type returns 403."""
    geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON}

    response = client.post(
        f"/api/scenarios/{scenario.id}/exposure-layers/",
        data=json.dumps({"type_id": str(non_editable_type.id), "geometry": geometry}),
        content_type="application/json",
    )

    assert response.status_code == http_forbidden


# --- POST (publish) Tests ---


@pytest.mark.django_db
def test_user_can_publish_exposure_layer(client, mock_user_id, scenario, user_drawn_type):
    """Test that POST publish layer is successful."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/publish/")
    assert response.status_code == http_ok

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.PENDING


@pytest.mark.django_db
def test_user_cannot_publish_exposure_layer_of_another_user(client, scenario, user_drawn_type):
    """Test that a user cannot publish a layer belonging to another user."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/publish/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_user_cannot_publish_exposure_layer_non_editable_type(client, scenario, non_editable_type):
    """Test that a user cannot publish a layer with a non-editable type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/publish/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_user_cannot_publish_exposure_layer_pending(
    client, mock_user_id, scenario, user_drawn_type
):
    """Test user can't publish an exposure layer which is already pending."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/publish/")
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_user_cannot_publish_exposure_layer_approved(
    client, mock_user_id, scenario, user_drawn_type
):
    """Test that POST publish layer is successful."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/publish/")
    assert response.status_code == http_bad_request


# --- POST (approve) Tests ---


@pytest.mark.django_db
def test_admin_user_can_approve_exposure_layer(client, mock_user_id, scenario, user_drawn_type):
    """Test that POST approve layer is successful."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/approve/")
    assert response.status_code == http_ok

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.APPROVED
    assert db_layer.approved_by == mock_user_id
    assert db_layer.published_id == "UD.1"


@pytest.mark.django_db
def test_admin_user_cannot_approve_exposure_layer_non_editable_type(
    client, scenario, non_editable_type
):
    """Test that an admin cannot approve a layer with a non-editable type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/approve/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_admin_user_cannot_approve_exposure_layer_unpublished(
    client,
    mock_user_id,  # noqa: ARG001
    scenario,
    user_drawn_type,
):
    """Test that admin user cannot approve unpublished layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/approve/")
    assert response.status_code == http_bad_request

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.UNPUBLISHED


@pytest.mark.django_db
def test_admin_user_cannot_approve_exposure_layer_approved(
    client,
    mock_user_id,  # noqa: ARG001
    scenario,
    user_drawn_type,
):
    """Test that admin user cannot approve already-approved layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/approve/")
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_general_user_cannot_approve_exposure_layer(client, monkeypatch, scenario):
    """Test general user receives 403 when attempting to approve a layer."""
    monkeypatch.setattr("api.views.scenario_exposure_layers.Administrator", Administrator)

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{uuid.uuid4()}/approve/")
    assert response.status_code == http_forbidden


# --- POST (reject) Tests ---


@pytest.mark.django_db
def test_admin_user_can_reject_exposure_layer(client, mock_user_id, scenario, user_drawn_type):
    """Test that POST reject layer is successful."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/reject/")
    assert response.status_code == http_ok

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.UNPUBLISHED
    assert db_layer.rejected_by == mock_user_id


@pytest.mark.django_db
def test_admin_user_cannot_reject_exposure_layer_non_editable_type(
    client, scenario, non_editable_type
):
    """Test that an admin cannot reject a layer with a non-editable type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/reject/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_admin_user_cannot_reject_exposure_layer_unpublished(
    client,
    mock_user_id,  # noqa: ARG001
    scenario,
    user_drawn_type,
):
    """Test that admin user cannot reject unpublished layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/reject/")
    assert response.status_code == http_bad_request

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.UNPUBLISHED


@pytest.mark.django_db
def test_admin_user_cannot_reject_exposure_layer_approved(
    client,
    mock_user_id,  # noqa: ARG001
    scenario,
    user_drawn_type,
):
    """Test that admin user cannot approve already-approved layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/reject/")
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_general_user_cannot_reject_exposure_layer(client, monkeypatch, scenario):
    """Test general user receives 403 when attempting to reject a layer."""
    monkeypatch.setattr("api.views.scenario_exposure_layers.Administrator", Administrator)

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{uuid.uuid4()}/reject/")
    assert response.status_code == http_forbidden


# --- POST (remove) Tests ---


@pytest.mark.django_db
def test_admin_user_can_remove_exposure_layer(client, mock_user_id, scenario, user_drawn_type):
    """Test that POST remove layer is successful."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/remove/")
    assert response.status_code == http_ok

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.UNPUBLISHED
    assert db_layer.removed_by == mock_user_id


@pytest.mark.django_db
def test_admin_user_cannot_remove_exposure_layer_non_editable_type(
    client, scenario, non_editable_type
):
    """Test that an admin cannot remove a layer with a non-editable type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/remove/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_admin_user_cannot_remove_exposure_layer_unpublished(client, scenario, user_drawn_type):
    """Test that admin user cannot remove unpublished layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/remove/")
    assert response.status_code == http_bad_request

    db_layer = ExposureLayer.objects.get(id=user_layer.id)
    assert db_layer.status == ExposureLayer.UNPUBLISHED


@pytest.mark.django_db
def test_admin_user_cannot_remove_exposure_layer_pending(client, scenario, user_drawn_type):
    """Test that admin user cannot remove a pending layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    user_layer = ExposureLayer.objects.create(
        name="My User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{user_layer.id}/remove/")
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_general_user_cannot_remove_exposure_layer(client, monkeypatch, scenario):
    """Test general user receives 403 when attempting to remove a layer."""
    monkeypatch.setattr("api.views.scenario_exposure_layers.Administrator", Administrator)

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{uuid.uuid4()}/remove/")
    assert response.status_code == http_forbidden


# --- PATCH Tests ---


@pytest.mark.django_db
def test_update_user_exposure_layer_name(scenario, mock_user_id, user_drawn_type, client):
    """Test renaming a user-drawn layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Original Name",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "New Name"}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_ok
    assert data["name"] == "New Name"

    layer.refresh_from_db()
    assert layer.name == "New Name"


@pytest.mark.django_db
def test_update_user_exposure_layer_geometry(scenario, mock_user_id, user_drawn_type, client):
    """Test updating geometry of a user-drawn layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Test Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    new_geometry = {"type": "Polygon", "coordinates": SAMPLE_POLYGON_2}

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"geometry": new_geometry}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_ok
    assert data["geometry"] == new_geometry


@pytest.mark.django_db
def test_cannot_update_other_users_layer(scenario, user_drawn_type, client):
    """Test that users cannot update other users' layers."""
    other_user_id = uuid.uuid4()
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Other User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "Hacked Name"}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_cannot_update_system_layer(scenario, non_editable_type, client):
    """Test that users cannot update system layers (is_user_editable=False, no user_id)."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "Hacked Name"}),
        content_type="application/json",
    )

    assert response.status_code == http_not_found
    layer.refresh_from_db()
    assert layer.name == "System Layer"


@pytest.mark.django_db
def test_cannot_update_layer_with_non_editable_type(
    scenario, mock_user_id, non_editable_type, client
):
    """Test that PATCH returns 403 when layer's type has is_user_editable=False."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="User Layer Non-Editable Type",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "Hacked Name"}),
        content_type="application/json",
    )

    assert response.status_code == http_forbidden
    layer.refresh_from_db()
    assert layer.name == "User Layer Non-Editable Type"


@pytest.mark.django_db
def test_cannot_update_pending_layer(scenario, mock_user_id, user_drawn_type, client):
    """Test that PATCH returns 403 for a pending layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Pending Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "Should Not Work"}),
        content_type="application/json",
    )

    assert response.status_code == http_forbidden
    layer.refresh_from_db()
    assert layer.name == "Pending Layer"


@pytest.mark.django_db
def test_cannot_update_approved_layer(scenario, mock_user_id, user_drawn_type, client):
    """Test that PATCH returns 403 for an approved layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Approved Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.patch(
        f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/",
        data=json.dumps({"name": "Should Not Work"}),
        content_type="application/json",
    )

    assert response.status_code == http_forbidden
    layer.refresh_from_db()
    assert layer.name == "Approved Layer"


# --- DELETE Tests ---


@pytest.mark.django_db
def test_delete_user_exposure_layer(scenario, mock_user_id, user_drawn_type, client):
    """Test deleting a user-drawn layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="To Delete",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    layer_id = layer.id

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_no_content
    assert not ExposureLayer.objects.filter(id=layer_id).exists()


@pytest.mark.django_db
def test_cannot_delete_other_users_layer(scenario, user_drawn_type, client):
    """Test that users cannot delete other users' layers."""
    other_user_id = uuid.uuid4()
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Other User Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
    )

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_not_found
    assert ExposureLayer.objects.filter(id=layer.id).exists()


@pytest.mark.django_db
def test_cannot_delete_system_layer(scenario, non_editable_type, client):
    """Test that users cannot delete system layers (is_user_editable=False, no user_id)."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="System Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_not_found
    assert ExposureLayer.objects.filter(id=layer.id).exists()


@pytest.mark.django_db
def test_cannot_delete_layer_with_non_editable_type(
    scenario, mock_user_id, non_editable_type, client
):
    """Test that DELETE returns 403 when layer's type has is_user_editable=False."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="User Layer Non-Editable Type",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_forbidden
    assert ExposureLayer.objects.filter(id=layer.id).exists()


@pytest.mark.django_db
def test_cannot_delete_pending_layer(scenario, mock_user_id, user_drawn_type, client):
    """Test that DELETE returns 403 for a pending layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Pending Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_forbidden
    assert ExposureLayer.objects.filter(id=layer.id).exists()


@pytest.mark.django_db
def test_cannot_delete_approved_layer(scenario, mock_user_id, user_drawn_type, client):
    """Test that DELETE returns 403 for an approved layer."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer = ExposureLayer.objects.create(
        name="Approved Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.delete(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/")

    assert response.status_code == http_forbidden
    assert ExposureLayer.objects.filter(id=layer.id).exists()


# --- PUT (Bulk Visibility) Tests ---


@pytest.mark.django_db
def test_bulk_enable_exposure_layers_by_ids(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test bulk enabling visibility for specific exposure layers."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer1 = ExposureLayer.objects.create(
        name="Layer 1",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    layer2 = ExposureLayer.objects.create(
        name="Layer 2",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(layer1.id), str(layer2.id)],
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_ok, f"Got: {data}"
    assert data["isActive"] is True
    assert len(data["exposureLayerIds"]) == 2

    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=layer1
    ).exists()
    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=layer2
    ).exists()


@pytest.mark.django_db
def test_bulk_disable_exposure_layers_by_type_id(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test bulk disabling all layers of a type."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    layer1 = ExposureLayer.objects.create(
        name="Layer 1",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    layer2 = ExposureLayer.objects.create(
        name="Layer 2",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    VisibleExposureLayer.objects.create(focus_area=focus_area, exposure_layer=layer1)
    VisibleExposureLayer.objects.create(focus_area=focus_area, exposure_layer=layer2)

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "type_id": str(user_drawn_type.id),
                "focus_area_id": str(focus_area.id),
                "is_active": False,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_ok, f"Got: {data}"
    assert data["isActive"] is False

    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=layer1
    ).exists()
    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=layer2
    ).exists()


@pytest.mark.django_db
def test_bulk_toggle_requires_focus_area_id(scenario, client):
    """Test that bulk toggle requires focus_area_id."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(uuid.uuid4())],
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_bulk_toggle_requires_ids_or_type(scenario, focus_area, client):
    """Test that bulk toggle requires either exposure_layer_ids or type_id."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_bulk_toggle_with_invalid_layer_ids(scenario, focus_area, client):
    """Test that bulk toggle with invalid layer IDs returns 400."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(uuid.uuid4()), str(uuid.uuid4())],
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert "invalid" in response.json().get("error", "").lower()


@pytest.mark.django_db
def test_bulk_toggle_with_mixed_valid_invalid_ids(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test that bulk toggle fails if any layer ID is invalid."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    valid_layer = ExposureLayer.objects.create(
        name="Valid Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(valid_layer.id), str(uuid.uuid4())],
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request
    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=valid_layer
    ).exists()


@pytest.mark.django_db
def test_bulk_toggle_other_users_approved_layers_by_ids(
    scenario, focus_area, user_drawn_type, client
):
    """Test bulk toggling visibility for approved layers from another user."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    other_user_id = uuid.uuid4()
    other_approved = ExposureLayer.objects.create(
        name="Other Approved",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(other_approved.id)],
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=other_approved
    ).exists()

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "exposure_layer_ids": [str(other_approved.id)],
                "focus_area_id": str(focus_area.id),
                "is_active": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=other_approved
    ).exists()


@pytest.mark.django_db
def test_bulk_toggle_other_users_approved_layers_by_type(
    scenario, focus_area, mock_user_id, user_drawn_type, client
):
    """Test bulk toggling by type includes approved layers from other users."""
    geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
    own_layer = ExposureLayer.objects.create(
        name="Own Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
    )
    other_user_id = uuid.uuid4()
    other_approved = ExposureLayer.objects.create(
        name="Other Approved",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=user_drawn_type,
        user_id=other_user_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/bulk/",
        data=json.dumps(
            {
                "type_id": str(user_drawn_type.id),
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=own_layer
    ).exists()
    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area, exposure_layer=other_approved
    ).exists()


@pytest.mark.django_db
def test_remove_cleans_up_non_owner_visibility_records(
    scenario, mock_user_id, user_drawn_type, client
):
    """Test that removing a layer removes visibility records for non-owners."""
    owner_id = uuid.uuid4()
    layer = ExposureLayer.objects.create(
        name="Approved Layer",
        geometry=GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))"),
        geometry_buffered=buffer_geometry(
            GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")
        ),
        type=user_drawn_type,
        user_id=owner_id,
        scenario=scenario,
        status=ExposureLayer.APPROVED,
    )

    owner_focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=owner_id,
        name="Owner Area",
        geometry=GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))"),
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    other_focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Other Area",
        geometry=GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))"),
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )

    VisibleExposureLayer.objects.create(focus_area=owner_focus_area, exposure_layer=layer)
    VisibleExposureLayer.objects.create(focus_area=other_focus_area, exposure_layer=layer)

    response = client.post(f"/api/scenarios/{scenario.id}/exposure-layers/{layer.id}/remove/")
    assert response.status_code == http_ok

    assert VisibleExposureLayer.objects.filter(
        focus_area=owner_focus_area, exposure_layer=layer
    ).exists()
    assert not VisibleExposureLayer.objects.filter(
        focus_area=other_focus_area, exposure_layer=layer
    ).exists()
