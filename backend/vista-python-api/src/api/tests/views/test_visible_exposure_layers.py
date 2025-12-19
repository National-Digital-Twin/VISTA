"""Tests for the visible exposure layers endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType

http_success_code = 200
http_bad_request = 400
http_not_found = 404


def find_exposure_layer_in_tree(data, exposure_layer_id):
    """Find an exposure layer in the data tree."""
    exposure_layer_id_str = str(exposure_layer_id)
    for exposure_layer_type in data:
        for exposure_layer in exposure_layer_type.get("exposureLayers", []):
            if exposure_layer["id"] == exposure_layer_id_str:
                return exposure_layer
    return None


@pytest.fixture
def exposure_layer(db):  # noqa: ARG001
    """Create a sample exposure layer."""
    exposure_layer_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Type 1")
    geom = GEOSGeometry("POLYGON((0 0, 0 0.5, 0.5 0.5, 0.5 0, 0 0))")
    return ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Exposure Layer 1", geometry=geom, type=exposure_layer_type
    )


@pytest.fixture
def focus_area(db, scenario):  # noqa: ARG001
    """Create a sample focus area."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
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


@pytest.mark.django_db
def test_enable_exposure_layer_for_focus_area(scenario, exposure_layer, focus_area, client):
    """Test enabling an exposure layer for a specific focus area."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["exposureLayerId"] == str(exposure_layer.id)
    assert data["focusAreaId"] == str(focus_area.id)
    assert data["isActive"] is True

    assert VisibleExposureLayer.objects.filter(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_enable_exposure_layer_for_mapwide_focus_area(
    scenario, exposure_layer, mapwide_focus_area, client
):
    """Test enabling an exposure layer for the map-wide focus area."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["focusAreaId"] == str(mapwide_focus_area.id)
    assert data["isActive"] is True

    assert VisibleExposureLayer.objects.filter(
        focus_area=mapwide_focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_disable_exposure_layer_deletes_record(scenario, exposure_layer, focus_area, client):
    """Test that disabling an exposure layer deletes the VisibleExposureLayer record."""
    VisibleExposureLayer.objects.create(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False
    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_enable_is_idempotent(scenario, exposure_layer, focus_area, client):
    """Test that enabling twice doesn't create duplicates."""
    url = f"/api/scenarios/{scenario.id}/visible-exposure-layers/"
    payload = json.dumps(
        {
            "exposureLayerId": str(exposure_layer.id),
            "focusAreaId": str(focus_area.id),
            "isActive": True,
        }
    )

    client.put(url, data=payload, content_type="application/json")
    client.put(url, data=payload, content_type="application/json")

    count = VisibleExposureLayer.objects.filter(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).count()
    assert count == 1


@pytest.mark.django_db
def test_disable_nonexistent_is_noop(scenario, exposure_layer, focus_area, client):
    """Test that disabling a non-visible exposure layer is a no-op."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code


@pytest.mark.django_db
def test_toggle_requires_focus_area_id(scenario, exposure_layer, client):
    """Test that focus_area_id is required for toggling visibility."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposureLayerId": str(exposure_layer.id), "isActive": True}),
        content_type="application/json",
    )

    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_scenario_exposure_layers_requires_focus_area_id(scenario, client):
    """Test that focus_area_id query param is required for listing exposure layers."""
    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")

    assert response.status_code == http_bad_request
    assert "focus_area_id" in response.json().get("error", "")


@pytest.mark.django_db
def test_scenario_exposure_layers_with_visibility(scenario, exposure_layer, focus_area, client):
    """Test scenario exposure layers endpoint returns nested structure with isActive."""
    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) >= 1

    exposure_layer_type = data[0]
    assert "id" in exposure_layer_type
    assert "name" in exposure_layer_type
    assert "exposureLayers" in exposure_layer_type

    exposure_layer_data = find_exposure_layer_in_tree(data, exposure_layer.id)
    assert exposure_layer_data is not None
    assert "isActive" in exposure_layer_data
    assert exposure_layer_data["isActive"] is False


@pytest.mark.django_db
def test_scenario_exposure_layers_after_enable(scenario, exposure_layer, focus_area, client):
    """Test isActive is true after enabling visibility."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    exposure_layer_data = find_exposure_layer_in_tree(data, exposure_layer.id)
    assert exposure_layer_data["isActive"] is True


@pytest.mark.django_db
def test_scenario_exposure_layers_visibility_is_per_focus_area(
    scenario, exposure_layer, focus_area, mapwide_focus_area, client
):
    """Test that visibility is scoped to focus area."""
    # Enable for specific focus area
    client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )

    # Should be visible in focus area
    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()
    exposure_layer_data = find_exposure_layer_in_tree(data, exposure_layer.id)
    assert exposure_layer_data["isActive"] is True

    # Should NOT be visible in map-wide
    response_map_wide = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={mapwide_focus_area.id}"
    )
    data_map_wide = response_map_wide.json()
    exposure_layer_data_map = find_exposure_layer_in_tree(data_map_wide, exposure_layer.id)
    assert exposure_layer_data_map["isActive"] is False


@pytest.mark.django_db
def test_scenario_exposure_layers_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/exposure-layers/?focus_area_id={fake_id}")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_disable_focus_area_does_not_affect_other_focus_areas(
    scenario, exposure_layer, focus_area, mapwide_focus_area, client
):
    """Test that disabling visibility for one focus area doesn't affect others."""
    # Enable for both focus areas
    VisibleExposureLayer.objects.create(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    )
    VisibleExposureLayer.objects.create(
        focus_area=mapwide_focus_area,
        exposure_layer=exposure_layer,
    )

    # Disable for focus area
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposureLayerId": str(exposure_layer.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Focus area should be deleted
    assert not VisibleExposureLayer.objects.filter(
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()

    # Map-wide should still exist
    assert VisibleExposureLayer.objects.filter(
        focus_area=mapwide_focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_exposure_layers_filtered_by_focus_area_geometry(scenario, client):
    """Test that only exposure layers intersecting focus area geometry are returned."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Create exposure layer type
    exposure_layer_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Floods")

    # Create exposure layer inside the focus area (0,0 to 1,1)
    inside_geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.8, 0.8 0.8, 0.8 0.2, 0.2 0.2))")
    inside_layer = ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Inside Layer", geometry=inside_geom, type=exposure_layer_type
    )

    # Create exposure layer outside the focus area
    outside_geom = GEOSGeometry("POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))")
    ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Outside Layer", geometry=outside_geom, type=exposure_layer_type
    )

    # Create focus area with geometry
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Focus Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code

    # Should find the inside layer
    inside_layer_data = find_exposure_layer_in_tree(data, inside_layer.id)
    assert inside_layer_data is not None

    # Should NOT find the outside layer (filtered out by geometry)
    all_layer_ids = [el["id"] for elt in data for el in elt.get("exposureLayers", [])]

    assert str(inside_layer.id) in all_layer_ids
    # Outside layer should not be in results - count should only include inside layer
    assert len(all_layer_ids) == 1


@pytest.mark.django_db
def test_empty_exposure_layer_types_have_empty_arrays(scenario, client):
    """Test that exposure layer types with no layers have empty exposureLayers arrays."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Create two exposure layer types
    type_with_layers = ExposureLayerType.objects.create(id=uuid.uuid4(), name="With Layers")
    type_without_layers = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Without Layers")

    # Create exposure layer inside the focus area for first type
    inside_geom = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.8, 0.8 0.8, 0.8 0.2, 0.2 0.2))")
    ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Inside Layer", geometry=inside_geom, type=type_with_layers
    )

    # Create exposure layer outside the focus area for second type
    outside_geom = GEOSGeometry("POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))")
    ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Outside Layer", geometry=outside_geom, type=type_without_layers
    )

    # Create focus area with geometry
    focus_area_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Test Focus Area",
        geometry=focus_area_geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code

    # Both types should be present
    types_by_name = {t["name"]: t for t in data}
    assert "With Layers" in types_by_name
    assert "Without Layers" in types_by_name

    # Type with layers inside focus area should have layers
    assert len(types_by_name["With Layers"]["exposureLayers"]) == 1

    # Type with layers outside focus area should have empty array
    assert len(types_by_name["Without Layers"]["exposureLayers"]) == 0


@pytest.mark.django_db
def test_mapwide_focus_area_returns_all_exposure_layers(scenario, mapwide_focus_area, client):
    """Test that map-wide focus area (no geometry) returns all exposure layers."""
    # Create exposure layer type
    exposure_layer_type = ExposureLayerType.objects.create(id=uuid.uuid4(), name="Rivers")

    # Create two exposure layers in different locations
    layer1_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    layer1 = ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Layer 1", geometry=layer1_geom, type=exposure_layer_type
    )

    layer2_geom = GEOSGeometry("POLYGON((10 10, 10 11, 11 11, 11 10, 10 10))")
    layer2 = ExposureLayer.objects.create(
        id=uuid.uuid4(), name="Layer 2", geometry=layer2_geom, type=exposure_layer_type
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/exposure-layers/?focus_area_id={mapwide_focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code

    # Should find both layers
    layer1_data = find_exposure_layer_in_tree(data, layer1.id)
    layer2_data = find_exposure_layer_in_tree(data, layer2.id)

    assert layer1_data is not None
    assert layer2_data is not None
