"""Tests for the visible asset types endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario, VisibleExposureLayer
from api.models.exposure_layer import ExposureLayer, ExposureLayerType

http_success_code = 200
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
def scenario(db):  # noqa: ARG001
    """Create a sample scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


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
        is_active=True,
    )


@pytest.mark.django_db
def test_enable_exposure_layer_map_wide(scenario, exposure_layer, client):
    """Test enabling an exposure layer type map-wide (no focus area)."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": True}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["exposureLayerId"] == str(exposure_layer.id)
    assert data["focusAreaId"] is None
    assert data["isActive"] is True

    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    assert VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_enable_exposure_layer_for_focus_area(scenario, exposure_layer, focus_area, client):
    """Test enabling an exposure layer for a specific focus area."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposure_layer_id": str(exposure_layer.id),
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["focusAreaId"] == str(focus_area.id)
    assert data["isActive"] is True

    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    assert VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_disable_exposure_layer_deletes_record(scenario, exposure_layer, client):
    """Test that disabling an asset type deletes the VisibleExposureLayer record."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    VisibleExposureLayer.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        exposure_layer=exposure_layer,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False
    assert not VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_enable_is_idempotent(scenario, exposure_layer, client):
    """Test that enabling twice doesn't create duplicates."""
    url = f"/api/scenarios/{scenario.id}/visible-exposure-layers/"
    payload = json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": True})

    client.put(url, data=payload, content_type="application/json")
    client.put(url, data=payload, content_type="application/json")

    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    count = VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        exposure_layer=exposure_layer,
    ).count()
    assert count == 1


@pytest.mark.django_db
def test_disable_nonexistent_is_noop(scenario, exposure_layer, client):
    """Test that disabling a non-visible asset type is a no-op."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": False}),
        content_type="application/json",
    )

    assert response.status_code == http_success_code


@pytest.mark.django_db
def test_scenario_exposure_layers_with_visibility(scenario, exposure_layer, client):
    """Test scenario asset types endpoint returns nested structure with isActive."""
    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
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
def test_scenario_exposure_layers_after_enable(scenario, exposure_layer, client):
    """Test isActive is true after enabling visibility."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": True}),
        content_type="application/json",
    )

    response = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
    data = response.json()

    exposure_layer_data = find_exposure_layer_in_tree(data, exposure_layer.id)
    assert exposure_layer_data["isActive"] is True


@pytest.mark.django_db
def test_scenario_exposure_layers_with_focus_area(scenario, exposure_layer, focus_area, client):
    """Test getting visibility for specific focus area."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposure_layer_id": str(exposure_layer.id),
                "focus_area_id": str(focus_area.id),
                "is_active": True,
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

    response_map_wide = client.get(f"/api/scenarios/{scenario.id}/exposure-layers/")
    data_map_wide = response_map_wide.json()
    exposure_layer_data_map = find_exposure_layer_in_tree(data_map_wide, exposure_layer.id)
    assert exposure_layer_data_map["isActive"] is False


@pytest.mark.django_db
def test_scenario_exposure_layers_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/exposure-layers/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_disable_map_wide_does_not_affect_focus_area(scenario, exposure_layer, focus_area, client):
    """Test that disabling map-wide visibility doesn't delete focus-area-specific visibility."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Enable both map-wide and focus-area-specific
    VisibleExposureLayer.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        exposure_layer=exposure_layer,
    )
    VisibleExposureLayer.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    )

    # Disable map-wide
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps({"exposure_layer_id": str(exposure_layer.id), "is_active": False}),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Map-wide should be deleted
    assert not VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        exposure_layer=exposure_layer,
    ).exists()

    # Focus-area-specific should still exist
    assert VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()


@pytest.mark.django_db
def test_disable_focus_area_does_not_affect_map_wide(scenario, exposure_layer, focus_area, client):
    """Test that disabling focus-area visibility doesn't delete map-wide visibility."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Enable both map-wide and focus-area-specific
    VisibleExposureLayer.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        exposure_layer=exposure_layer,
    )
    VisibleExposureLayer.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    )

    # Disable focus-area-specific
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-exposure-layers/",
        data=json.dumps(
            {
                "exposure_layer_id": str(exposure_layer.id),
                "focus_area_id": str(focus_area.id),
                "is_active": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Focus-area-specific should be deleted
    assert not VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        exposure_layer=exposure_layer,
    ).exists()

    # Map-wide should still exist
    assert VisibleExposureLayer.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        exposure_layer=exposure_layer,
    ).exists()
