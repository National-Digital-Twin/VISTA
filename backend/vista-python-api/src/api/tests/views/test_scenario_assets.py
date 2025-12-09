"""Tests for the scenario assets endpoint."""

import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry, Point

from api.models import FocusArea, Scenario, VisibleAsset
from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource

http_success_code = 200
http_not_found = 404


@pytest.fixture
def scenario(db):  # noqa: ARG001
    """Create a sample scenario."""
    return Scenario.objects.create(name="Test Scenario", is_active=True)


@pytest.fixture
def asset_types_for_scenario(db):  # noqa: ARG001
    """Create asset types for testing."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Test SubCategory", category_id=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")
    rail_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail Stations",
        sub_category_id=sub_category,
        data_source_id=data_source,
    )
    hospital_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Hospitals",
        sub_category_id=sub_category,
        data_source_id=data_source,
    )
    return {"rail": rail_type, "hospital": hospital_type}


@pytest.fixture
def assets_for_scenario(db, asset_types_for_scenario):  # noqa: ARG001
    """Create assets at specific locations for testing geometry filters."""
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    rail_inside = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Rail Station Inside",
        type=rail_type,
        geom=Point(0.5, 0.5),
    )
    rail_outside = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Rail Station Outside",
        type=rail_type,
        geom=Point(5.0, 5.0),
    )
    hospital_inside = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital Inside",
        type=hospital_type,
        geom=Point(0.5, 0.5),
    )
    hospital_outside = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital Outside",
        type=hospital_type,
        geom=Point(5.0, 5.0),
    )
    return {
        "rail_inside": rail_inside,
        "rail_outside": rail_outside,
        "hospital_inside": hospital_inside,
        "hospital_outside": hospital_outside,
    }


@pytest.fixture
def focus_area(db, scenario):  # noqa: ARG001
    """Create a focus area containing point (0.5, 0.5)."""
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
def test_scenario_assets_no_visibility_returns_empty(scenario, assets_for_scenario, client):  # noqa: ARG001
    """Test that no visibility settings returns empty array."""
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_scenario_assets_map_wide_visibility(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    client,
):
    """Test that map-wide visibility returns all assets of that type."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    expected_rail_asset_count = 2
    assert response.status_code == http_success_code
    assert len(data) == expected_rail_asset_count
    names = [a["name"] for a in data]
    assert "Rail Station Inside" in names
    assert "Rail Station Outside" in names


@pytest.mark.django_db
def test_scenario_assets_focus_area_visibility(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that focus area visibility only returns assets within geometry."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == "Rail Station Inside"


@pytest.mark.django_db
def test_scenario_assets_combined_visibility(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test combining map-wide and focus area visibility."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=rail_type,
    )
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=hospital_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    expected_combined_count = 3
    assert response.status_code == http_success_code
    assert len(data) == expected_combined_count
    names = [a["name"] for a in data]
    assert "Rail Station Inside" in names
    assert "Rail Station Outside" in names
    assert "Hospital Inside" in names
    assert "Hospital Outside" not in names  # Outside focus area geometry


@pytest.mark.django_db
def test_scenario_assets_inactive_focus_area_ignored(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that inactive focus areas are not used for filtering."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    rail_type = asset_types_for_scenario["rail"]

    focus_area.is_active = False
    focus_area.save()

    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_scenario_assets_invalid_scenario(client):
    """Test that invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/assets/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_scenario_assets_user_isolation(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    client,
):
    """Test that users only see assets for their own visibility settings."""
    other_user_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=other_user_id,
        focus_area=None,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_scenario_assets_exclude_map_wide(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that exclude_map_wide=true only returns focus area assets."""
    mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    # Enable map-wide for rail
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=None,
        asset_type=rail_type,
    )
    # Enable focus-area for hospital
    VisibleAsset.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        focus_area=focus_area,
        asset_type=hospital_type,
    )

    # Without flag: should return all 3 (2 rail + 1 hospital inside)
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    expected_total_count = 3
    assert len(data) == expected_total_count

    # With flag: should only return hospital inside focus area
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?exclude_map_wide=true")
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Hospital Inside"


def find_asset_type_in_tree(data, asset_type_name):
    """Find an asset type by name in the nested category tree."""
    for category in data:
        for sub_category in category.get("subCategories", []):
            for asset_type in sub_category.get("assetTypes", []):
                if asset_type["name"] == asset_type_name:
                    return asset_type
    return None


def get_all_asset_type_names(data):
    """Get all asset type names from the nested category tree."""
    return [
        asset_type["name"]
        for category in data
        for sub_category in category.get("subCategories", [])
        for asset_type in sub_category.get("assetTypes", [])
    ]


@pytest.mark.django_db
def test_asset_types_map_wide_returns_all(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001
    client,
):
    """Test that map-wide (no focus_area_id) returns all asset types."""
    response = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data = response.json()

    assert response.status_code == http_success_code
    names = get_all_asset_type_names(data)
    assert "Rail Stations" in names
    assert "Hospitals" in names


@pytest.mark.django_db
def test_asset_types_includes_datasource_id(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001
    client,
):
    """Test that asset types include datasourceId in response."""
    response = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data = response.json()

    assert response.status_code == http_success_code
    rail_type = find_asset_type_in_tree(data, "Rail Stations")
    assert rail_type is not None
    assert "datasourceId" in rail_type
    assert rail_type["datasourceId"] is not None


@pytest.mark.django_db
def test_asset_types_focus_area_filters_by_geometry(
    scenario,
    asset_types_for_scenario,
    focus_area,
    client,
):
    """Test that focus area only returns asset types with assets in that area."""
    # Create assets - only rail inside, only hospital outside
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Rail Inside Only",
        type=rail_type,
        geom=Point(0.5, 0.5),  # Inside focus area (0,0 to 1,1)
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital Outside Only",
        type=hospital_type,
        geom=Point(5.0, 5.0),  # Outside focus area
    )

    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    names = get_all_asset_type_names(data)
    assert "Rail Stations" in names
    assert "Hospitals" not in names


@pytest.mark.django_db
def test_asset_types_focus_area_returns_both_when_assets_in_area(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001  - creates assets inside and outside
    focus_area,
    client,
):
    """Test focus area returns both types when both have assets inside."""
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    names = get_all_asset_type_names(data)
    # Both rail_inside and hospital_inside exist at (0.5, 0.5) inside focus area
    assert "Rail Stations" in names
    assert "Hospitals" in names


@pytest.mark.django_db
def test_asset_types_focus_area_empty_when_no_assets(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test focus area returns empty when no assets in that area."""
    # No assets created, so nothing should match
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code
    names = get_all_asset_type_names(data)
    assert len(names) == 0


@pytest.mark.django_db
def test_asset_types_focus_area_invalid_returns_404(scenario, client):
    """Test that invalid focus_area_id returns 404."""
    fake_focus_area_id = uuid.uuid4()
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={fake_focus_area_id}"
    )
    assert response.status_code == http_not_found
