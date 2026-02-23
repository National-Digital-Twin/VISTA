"""Tests for the dataroom exposure layers endpoint."""

import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import Scenario
from api.models.exposure_layer import ExposureLayer, ExposureLayerType
from api.tests.conftest import buffer_geometry

SAMPLE_GEOM = GEOSGeometry("POLYGON((0.2 0.2, 0.2 0.3, 0.3 0.3, 0.3 0.2, 0.2 0.2))")

http_ok = 200
http_forbidden = 403
http_not_found = 404


class Administrator:
    """Mock administrator permission that denies access."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return False to simulate non-admin."""
        return False


@pytest.fixture
def system_type(db):  # noqa: ARG001
    """Create a non-user-editable exposure layer type."""
    return ExposureLayerType.objects.create(id=uuid.uuid4(), name="Floods", is_user_editable=False)


@pytest.fixture
def user_drawn_type(db):  # noqa: ARG001
    """Create a user-editable exposure layer type."""
    return ExposureLayerType.objects.create(
        id=uuid.uuid4(), name="User drawn", is_user_editable=True
    )


@pytest.fixture
def system_layer(system_type):
    """Create a system exposure layer."""
    return ExposureLayer.objects.create(
        name="Flood Zone A",
        geometry=SAMPLE_GEOM,
        geometry_buffered=buffer_geometry(SAMPLE_GEOM),
        type=system_type,
        status=ExposureLayer.APPROVED,
    )


@pytest.fixture
def pending_layer(scenario, user_drawn_type, mock_user_id):
    """Create a pending user-drawn exposure layer."""
    return ExposureLayer.objects.create(
        name="User Exposure 1",
        geometry=SAMPLE_GEOM,
        geometry_buffered=buffer_geometry(SAMPLE_GEOM),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.PENDING,
    )


@pytest.fixture
def approved_layer(scenario, user_drawn_type):
    """Create an approved user-drawn exposure layer from another user."""
    return ExposureLayer.objects.create(
        name="Other User Exposure",
        geometry=SAMPLE_GEOM,
        geometry_buffered=buffer_geometry(SAMPLE_GEOM),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=scenario,
        status=ExposureLayer.APPROVED,
        published_id_int=1,
    )


@pytest.fixture
def unpublished_layer(scenario, user_drawn_type, mock_user_id):
    """Create an unpublished (draft) user-drawn exposure layer."""
    return ExposureLayer.objects.create(
        name="Draft Layer",
        geometry=SAMPLE_GEOM,
        geometry_buffered=buffer_geometry(SAMPLE_GEOM),
        type=user_drawn_type,
        user_id=mock_user_id,
        scenario=scenario,
        status=ExposureLayer.UNPUBLISHED,
    )


@pytest.mark.django_db
@pytest.mark.usefixtures("unpublished_layer")
def test_get_returns_system_and_user_drawn_layers(
    scenario,
    system_layer,
    pending_layer,
    approved_layer,
    client,
):
    """Test GET returns submitted layers and excludes unpublished drafts."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 3

    ids = {item["id"] for item in data}
    assert str(system_layer.id) in ids
    assert str(pending_layer.id) in ids
    assert str(approved_layer.id) in ids


@pytest.mark.django_db
@pytest.mark.usefixtures("system_layer", "pending_layer")
def test_get_excludes_layers_from_other_scenarios(
    scenario,
    user_drawn_type,
    client,
):
    """Test GET excludes user-drawn layers from other scenarios."""
    other_scenario = Scenario.objects.create(
        id=uuid.uuid4(), name="Other Scenario", is_active=False
    )
    ExposureLayer.objects.create(
        name="Other Scenario Layer",
        geometry=SAMPLE_GEOM,
        geometry_buffered=buffer_geometry(SAMPLE_GEOM),
        type=user_drawn_type,
        user_id=uuid.uuid4(),
        scenario=other_scenario,
        status=ExposureLayer.PENDING,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    assert response.status_code == http_ok
    names = {item["name"] for item in data}
    assert "Other Scenario Layer" not in names
    assert "Flood Zone A" in names
    assert "User Exposure 1" in names


@pytest.mark.django_db
def test_get_excludes_unpublished_user_drawn_layers(
    scenario, user_drawn_type, mock_user_id, client
):
    """Test GET excludes unpublished user-drawn layers (still drafts)."""
    for layer_status in [ExposureLayer.UNPUBLISHED, ExposureLayer.PENDING, ExposureLayer.APPROVED]:
        ExposureLayer.objects.create(
            name=f"Layer {layer_status}",
            geometry=SAMPLE_GEOM,
            geometry_buffered=buffer_geometry(SAMPLE_GEOM),
            type=user_drawn_type,
            user_id=mock_user_id,
            scenario=scenario,
            status=layer_status,
        )

    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    assert response.status_code == http_ok
    statuses = {item["status"] for item in data}
    assert statuses == {"pending", "approved"}
    assert len(data) == 2


@pytest.mark.django_db
def test_get_status_is_null_for_system_layers(scenario, system_layer, client):
    """Test GET returns null status for system layers."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(system_layer.id))
    assert layer["status"] is None
    assert layer["isUserDefined"] is False


@pytest.mark.django_db
def test_get_returns_user_info_for_user_drawn(scenario, pending_layer, client):
    """Test GET returns nested user object for user-drawn layers."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(pending_layer.id))
    assert layer["user"] is not None
    assert layer["user"]["id"] == str(pending_layer.user_id)
    assert layer["user"]["name"] == "Dev User"
    assert layer["isUserDefined"] is True


@pytest.mark.django_db
def test_get_returns_null_user_for_system_layers(scenario, system_layer, client):
    """Test GET returns null user for system layers."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(system_layer.id))
    assert layer["user"] is None


@pytest.mark.django_db
def test_get_returns_type_info(scenario, system_layer, system_type, client):
    """Test GET returns nested type object with id and name."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(system_layer.id))
    assert layer["type"]["id"] == str(system_type.id)
    assert layer["type"]["name"] == "Floods"


@pytest.mark.django_db
def test_get_returns_geometry(scenario, system_layer, client):
    """Test GET returns geometry as GeoJSON."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(system_layer.id))
    assert layer["geometry"] is not None
    assert layer["geometry"]["type"] == "Polygon"


@pytest.mark.django_db
def test_get_returns_published_id(scenario, approved_layer, client):
    """Test GET returns published ID."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(approved_layer.id))
    assert layer["publishedId"] == approved_layer.published_id


@pytest.mark.django_db
@pytest.mark.usefixtures("system_layer", "pending_layer")
def test_get_does_not_return_published_id_for_unapproved_layers(scenario, client):
    """Test GET does not return published ID for layers that are not approved or system."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()
    for layer in data:
        assert layer["publishedId"] is None


@pytest.mark.django_db
def test_get_returns_timestamps(scenario, pending_layer, client):
    """Test GET returns createdAt and updatedAt."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    data = response.json()

    layer = next(d for d in data if d["id"] == str(pending_layer.id))
    assert layer["createdAt"] is not None
    assert layer["updatedAt"] is not None
    assert layer["updatedAt"] == layer["createdAt"]


@pytest.mark.django_db
def test_get_invalid_scenario_returns_404(client):
    """Test GET with invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/dataroom/exposure-layers/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_get_returns_403_for_non_admin(scenario, client, monkeypatch):
    """Test GET returns 403 when user is not admin."""
    monkeypatch.setattr("api.views.dataroom_exposure_layers.Administrator", Administrator)
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/exposure-layers/")
    assert response.status_code == http_forbidden
