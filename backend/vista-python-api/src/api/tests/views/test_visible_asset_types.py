"""Tests for the visible asset types endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource

http_success_code = 200
http_not_found = 404


def find_asset_type_in_tree(data, asset_type_id):
    """Find an asset type in the nested category/subcategory/assetType tree."""
    asset_type_id_str = str(asset_type_id)
    for category in data:
        for sub_category in category.get("subCategories", []):
            for asset_type in sub_category.get("assetTypes", []):
                if asset_type["id"] == asset_type_id_str:
                    return asset_type
    return None


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create a sample scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


@pytest.fixture
def asset_type(db):  # noqa: ARG001
    """Create a sample asset type."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Test SubCategory", category_id=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")
    return AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail Stations",
        sub_category_id=sub_category,
        data_source_id=data_source,
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
def test_enable_asset_type_map_wide(scenario, asset_type, client):
    """Test enabling an asset type map-wide (no focus area)."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps({"asset_type_id": str(asset_type.id), "is_active": True}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["assetTypeId"] == str(asset_type.id)
    assert data["focusAreaId"] is None
    assert data["isActive"] is True

    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    assert VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_enable_asset_type_for_focus_area(scenario, asset_type, focus_area, client):
    """Test enabling an asset type for a specific focus area."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "asset_type_id": str(asset_type.id),
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
    assert VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_disable_asset_type_deletes_record(scenario, asset_type, client):
    """Test that disabling an asset type deletes the VisibleAsset record."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=asset_type,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps({"asset_type_id": str(asset_type.id), "is_active": False}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False
    assert not VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_enable_is_idempotent(scenario, asset_type, client):
    """Test that enabling twice doesn't create duplicates."""
    url = f"/api/scenarios/{scenario.id}/visible-asset-types/"
    payload = json.dumps({"asset_type_id": str(asset_type.id), "is_active": True})

    client.put(url, data=payload, content_type="application/json")
    client.put(url, data=payload, content_type="application/json")

    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    count = VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        asset_type=asset_type,
    ).count()
    assert count == 1


@pytest.mark.django_db
def test_disable_nonexistent_is_noop(scenario, asset_type, client):
    """Test that disabling a non-visible asset type is a no-op."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps({"asset_type_id": str(asset_type.id), "is_active": False}),
        content_type="application/json",
    )

    assert response.status_code == http_success_code


@pytest.mark.django_db
def test_scenario_asset_types_with_visibility(scenario, asset_type, client):
    """Test scenario asset types endpoint returns nested structure with isActive."""
    response = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) >= 1

    # Verify structure: categories contain subCategories contain assetTypes
    category = data[0]
    assert "id" in category
    assert "name" in category
    assert "subCategories" in category

    asset_type_data = find_asset_type_in_tree(data, asset_type.id)
    assert asset_type_data is not None
    assert "isActive" in asset_type_data
    assert asset_type_data["isActive"] is False


@pytest.mark.django_db
def test_scenario_asset_types_after_enable(scenario, asset_type, client):
    """Test isActive is true after enabling visibility."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps({"asset_type_id": str(asset_type.id), "is_active": True}),
        content_type="application/json",
    )

    response = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data = response.json()

    asset_type_data = find_asset_type_in_tree(data, asset_type.id)
    assert asset_type_data["isActive"] is True


@pytest.mark.django_db
def test_scenario_asset_types_with_focus_area(scenario, asset_type, focus_area, client):
    """Test getting visibility for specific focus area."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "asset_type_id": str(asset_type.id),
                "focus_area_id": str(focus_area.id),
                "is_active": True,
            }
        ),
        content_type="application/json",
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    asset_type_data = find_asset_type_in_tree(data, asset_type.id)
    assert asset_type_data["isActive"] is True

    response_map_wide = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data_map_wide = response_map_wide.json()
    asset_type_data_map = find_asset_type_in_tree(data_map_wide, asset_type.id)
    assert asset_type_data_map["isActive"] is False


@pytest.mark.django_db
def test_scenario_asset_types_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/asset-types/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_disable_map_wide_does_not_affect_focus_area(scenario, asset_type, focus_area, client):
    """Test that disabling map-wide visibility doesn't delete focus-area-specific visibility."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Enable both map-wide and focus-area-specific
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=asset_type,
    )
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=asset_type,
    )

    # Disable map-wide
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps({"asset_type_id": str(asset_type.id), "is_active": False}),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Map-wide should be deleted
    assert not VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        asset_type=asset_type,
    ).exists()

    # Focus-area-specific should still exist
    assert VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_disable_focus_area_does_not_affect_map_wide(scenario, asset_type, focus_area, client):
    """Test that disabling focus-area visibility doesn't delete map-wide visibility."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Enable both map-wide and focus-area-specific
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=asset_type,
    )
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=asset_type,
    )

    # Disable focus-area-specific
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "asset_type_id": str(asset_type.id),
                "focus_area_id": str(focus_area.id),
                "is_active": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Focus-area-specific should be deleted
    assert not VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()

    # Map-wide should still exist
    assert VisibleAsset.objects.filter(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area__isnull=True,
        asset_type=asset_type,
    ).exists()
