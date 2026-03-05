# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the visible asset types endpoint."""

import json
import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry, Point

from api.models import AssetScoreFilter, FocusArea, Scenario, VisibleAsset
from api.models.asset import Asset
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
def sub_category_with_types(db):  # noqa: ARG001
    """Create a subcategory with multiple asset types for bulk toggle tests."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Bulk Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Bulk Test SubCategory", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Bulk Test Source")
    asset_type_1 = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Bulk Type 1",
        sub_category=sub_category,
        data_source=data_source,
    )
    asset_type_2 = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Bulk Type 2",
        sub_category=sub_category,
        data_source=data_source,
    )
    asset_type_3 = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Bulk Type 3",
        sub_category=sub_category,
        data_source=data_source,
    )
    return {
        "sub_category": sub_category,
        "asset_types": [asset_type_1, asset_type_2, asset_type_3],
    }


@pytest.fixture
def asset_type(db):  # noqa: ARG001
    """Create a sample asset type."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Test SubCategory", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")
    return AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail Stations",
        sub_category=sub_category,
        data_source=data_source,
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


@pytest.mark.django_db
def test_enable_asset_type_map_wide(scenario, asset_type, mapwide_focus_area, client):
    """Test enabling an asset type map-wide (using map-wide focus area)."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["assetTypeId"] == str(asset_type.id)
    assert data["focusAreaId"] == str(mapwide_focus_area.id)
    assert data["isActive"] is True

    assert VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_enable_asset_type_for_focus_area(scenario, asset_type, focus_area, client):
    """Test enabling an asset type for a specific focus area."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["focusAreaId"] == str(focus_area.id)
    assert data["isActive"] is True

    assert VisibleAsset.objects.filter(
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_disable_asset_type_deletes_record(scenario, asset_type, mapwide_focus_area, client):
    """Test that disabling an asset type deletes the VisibleAsset record."""
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False
    assert not VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_enable_is_idempotent(scenario, asset_type, mapwide_focus_area, client):
    """Test that enabling twice doesn't create duplicates."""
    url = f"/api/scenarios/{scenario.id}/visible-asset-types/"
    payload = json.dumps(
        {
            "assetTypeId": str(asset_type.id),
            "focusAreaId": str(mapwide_focus_area.id),
            "isActive": True,
        }
    )

    client.put(url, data=payload, content_type="application/json")
    client.put(url, data=payload, content_type="application/json")

    count = VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    ).count()
    assert count == 1


@pytest.mark.django_db
def test_disable_nonexistent_is_noop(scenario, asset_type, mapwide_focus_area, client):
    """Test that disabling a non-visible asset type is a no-op."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": False,
            }
        ),
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
def test_scenario_asset_types_after_enable(scenario, asset_type, mapwide_focus_area, client):
    """Test isActive is true after enabling visibility."""
    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={mapwide_focus_area.id}"
    )
    data = response.json()

    asset_type_data = find_asset_type_in_tree(data, asset_type.id)
    assert asset_type_data["isActive"] is True


@pytest.mark.django_db
def test_scenario_asset_types_with_focus_area(
    scenario, asset_type, focus_area, mapwide_focus_area, client
):
    """Test getting visibility for specific focus area."""
    # Create an asset inside the focus area bounds
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Test Asset Inside",
        type=asset_type,
        geom=Point(0.5, 0.5),  # Inside focus area (0,0 to 1,1)
    )

    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
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

    response_map_wide = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={mapwide_focus_area.id}"
    )
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
def test_disable_map_wide_does_not_affect_focus_area(
    scenario, asset_type, focus_area, mapwide_focus_area, client
):
    """Test that disabling map-wide visibility doesn't delete focus-area-specific visibility."""
    # Enable both map-wide and focus-area-specific
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    )
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
    )

    # Disable map-wide
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(mapwide_focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Map-wide should be deleted
    assert not VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    ).exists()

    # Focus-area-specific should still exist
    assert VisibleAsset.objects.filter(
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_disable_focus_area_does_not_affect_map_wide(
    scenario, asset_type, focus_area, mapwide_focus_area, client
):
    """Test that disabling focus-area visibility doesn't delete map-wide visibility."""
    # Enable both map-wide and focus-area-specific
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    )
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
    )

    # Disable focus-area-specific
    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/",
        data=json.dumps(
            {
                "assetTypeId": str(asset_type.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == http_success_code

    # Focus-area-specific should be deleted
    assert not VisibleAsset.objects.filter(
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()

    # Map-wide should still exist
    assert VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    ).exists()


@pytest.mark.django_db
def test_delete_clears_all_map_wide_visibility(scenario, asset_type, mapwide_focus_area, client):
    """Test DELETE clears all map-wide visibility."""
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    )

    response = client.delete(
        f"/api/scenarios/{scenario.id}/visible-asset-types/?focus_area_id={mapwide_focus_area.id}"
    )

    assert response.status_code == http_success_code, f"Response: {response.content}"
    data = response.json()

    assert data["success"] is True
    assert not VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
    ).exists()


@pytest.mark.django_db
def test_delete_clears_focus_area_visibility(
    scenario, asset_type, focus_area, mapwide_focus_area, client
):
    """Test DELETE with focus_area_id clears only that focus area's visibility."""
    # Create visibility for both map-wide and focus area
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=asset_type,
    )
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
    )

    response = client.delete(
        f"/api/scenarios/{scenario.id}/visible-asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["success"] is True

    # Focus area visibility should be deleted
    assert not VisibleAsset.objects.filter(
        focus_area=focus_area,
    ).exists()

    # Map-wide visibility should still exist
    assert VisibleAsset.objects.filter(
        focus_area=mapwide_focus_area,
    ).exists()


@pytest.mark.django_db
def test_delete_with_no_visible_assets(scenario, mapwide_focus_area, client):
    """Test DELETE succeeds even when nothing to delete."""
    response = client.delete(
        f"/api/scenarios/{scenario.id}/visible-asset-types/?focus_area_id={mapwide_focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["success"] is True


@pytest.mark.django_db
def test_delete_clears_per_asset_type_score_filters(scenario, asset_type, focus_area, client):
    """Test DELETE clears per-asset-type score filters but preserves global filter."""
    # Create a per-asset-type score filter
    per_type_filter = AssetScoreFilter.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
        criticality_values=[1, 2],
    )

    # Create a global score filter (asset_type=NULL)
    global_filter = AssetScoreFilter.objects.create(
        focus_area=focus_area,
        asset_type=None,
        criticality_values=[3, 4],
    )

    # Create visibility
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
    )

    response = client.delete(
        f"/api/scenarios/{scenario.id}/visible-asset-types/?focus_area_id={focus_area.id}"
    )

    assert response.status_code == http_success_code

    # Per-asset-type filter should be deleted
    assert not AssetScoreFilter.objects.filter(id=per_type_filter.id).exists()

    # Global filter should still exist
    assert AssetScoreFilter.objects.filter(id=global_filter.id).exists()


# Bulk toggle tests


@pytest.mark.django_db
def test_bulk_enable_all_asset_types_in_subcategory(
    scenario, sub_category_with_types, focus_area, client
):
    """Test bulk enabling all asset types in a subcategory."""
    sub_category = sub_category_with_types["sub_category"]
    asset_types = sub_category_with_types["asset_types"]

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/",
        data=json.dumps(
            {
                "subCategoryId": str(sub_category.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["subCategoryId"] == str(sub_category.id)
    assert data["focusAreaId"] == str(focus_area.id)
    assert data["isActive"] is True

    # Verify all asset types are now visible
    for asset_type in asset_types:
        assert VisibleAsset.objects.filter(
            focus_area=focus_area,
            asset_type=asset_type,
        ).exists()


@pytest.mark.django_db
def test_bulk_disable_all_asset_types_in_subcategory(
    scenario, sub_category_with_types, focus_area, client
):
    """Test bulk disabling all asset types in a subcategory."""
    sub_category = sub_category_with_types["sub_category"]
    asset_types = sub_category_with_types["asset_types"]

    # First enable all
    for asset_type in asset_types:
        VisibleAsset.objects.create(
            focus_area=focus_area,
            asset_type=asset_type,
        )

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/",
        data=json.dumps(
            {
                "subCategoryId": str(sub_category.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_success_code
    assert data["isActive"] is False

    # Verify all asset types are now hidden
    for asset_type in asset_types:
        assert not VisibleAsset.objects.filter(
            focus_area=focus_area,
            asset_type=asset_type,
        ).exists()


@pytest.mark.django_db
def test_bulk_enable_is_idempotent(scenario, sub_category_with_types, focus_area, client):
    """Test that bulk enabling twice doesn't create duplicates."""
    sub_category = sub_category_with_types["sub_category"]
    asset_types = sub_category_with_types["asset_types"]

    url = f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/"
    payload = json.dumps(
        {
            "subCategoryId": str(sub_category.id),
            "focusAreaId": str(focus_area.id),
            "isActive": True,
        }
    )

    client.put(url, data=payload, content_type="application/json")
    client.put(url, data=payload, content_type="application/json")

    # Verify each asset type has exactly one visibility record
    for asset_type in asset_types:
        count = VisibleAsset.objects.filter(
            focus_area=focus_area,
            asset_type=asset_type,
        ).count()
        assert count == 1


@pytest.mark.django_db
def test_bulk_toggle_invalid_subcategory(scenario, focus_area, client):
    """Test bulk toggle with invalid subcategory returns 404."""
    fake_id = uuid.uuid4()

    response = client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/",
        data=json.dumps(
            {
                "subCategoryId": str(fake_id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_bulk_toggle_does_not_affect_other_subcategories(
    scenario, sub_category_with_types, asset_type, focus_area, client
):
    """Test bulk toggle only affects asset types in the specified subcategory."""
    sub_category = sub_category_with_types["sub_category"]

    # Enable the asset_type from a different subcategory
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=asset_type,
    )

    # Bulk enable the test subcategory
    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/",
        data=json.dumps(
            {
                "subCategoryId": str(sub_category.id),
                "focusAreaId": str(focus_area.id),
                "isActive": True,
            }
        ),
        content_type="application/json",
    )

    # The other asset type should still be visible (unchanged)
    assert VisibleAsset.objects.filter(
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()

    # Now bulk disable
    client.put(
        f"/api/scenarios/{scenario.id}/visible-asset-types/bulk/",
        data=json.dumps(
            {
                "subCategoryId": str(sub_category.id),
                "focusAreaId": str(focus_area.id),
                "isActive": False,
            }
        ),
        content_type="application/json",
    )

    # The other asset type should still be visible (unchanged)
    assert VisibleAsset.objects.filter(
        focus_area=focus_area,
        asset_type=asset_type,
    ).exists()
