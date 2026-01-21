"""Tests for the scenario assets endpoint."""
# ruff: noqa: T201 - print statements are intentional for SQL visualization

import uuid

import pytest
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon
from django.db import connection
from django.test.utils import CaptureQueriesContext

from api.models import (
    AssetScoreFilter,
    ExposureLayer,
    ExposureLayerType,
    FocusArea,
    Scenario,
    ScenarioAsset,
    VisibleAsset,
    VisibleExposureLayer,
)
from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.tests.conftest import buffer_geometry

http_success_code = 200
http_not_found = 404


def print_sql(test_name: str, queries: list[dict]) -> None:
    """Print SQL queries for debugging (visible with pytest -s flag)."""
    print("\n" + "=" * 80)
    print(f"SQL for: {test_name}")
    print("=" * 80)
    for i, q in enumerate(queries):
        print(f"\n[Query {i + 1}]")
        print(q["sql"])
    print("=" * 80 + "\n")


@pytest.fixture
def asset_type_setup(db):  # noqa: ARG001
    """Create test asset types."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Infrastructure")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Energy", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")

    station_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Stations",
        sub_category=sub_category,
        data_source=data_source,
    )
    pylon_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Pylons",
        sub_category=sub_category,
        data_source=data_source,
    )

    return {
        "category": category,
        "sub_category": sub_category,
        "data_source": data_source,
        "station_type": station_type,
        "pylon_type": pylon_type,
    }


@pytest.fixture
def scenario_assets(scenario, asset_type_setup):
    """Create ScenarioAsset records to populate asset_scores view."""
    station_type = asset_type_setup["station_type"]
    pylon_type = asset_type_setup["pylon_type"]

    return [
        ScenarioAsset.objects.create(
            scenario=scenario,
            asset_type=station_type,
            criticality_score=3,
        ),
        ScenarioAsset.objects.create(
            scenario=scenario,
            asset_type=pylon_type,
            criticality_score=1,
        ),
    ]


@pytest.fixture
def asset_types_for_scenario(db):  # noqa: ARG001
    """Create asset types for testing."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Test SubCategory", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")
    rail_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail Stations",
        sub_category=sub_category,
        data_source=data_source,
    )
    hospital_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Hospitals",
        sub_category=sub_category,
        data_source=data_source,
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
def focus_area(db, scenario, mock_user_id):  # noqa: ARG001
    """Create a focus area containing point (0.5, 0.5)."""
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
def test_scenario_assets_no_visibility_returns_empty(scenario, assets_for_scenario, client):  # noqa: ARG001
    """Test that no visibility settings returns empty array."""
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


# =============================================================================
# Focus Area ID Query Parameter Tests
# =============================================================================


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_returns_only_that_area(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,
    focus_area,
    client,
):
    """Test that focus_area_id query param returns only assets for that focus area."""
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={focus_area.id}")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == assets_for_scenario["rail_inside"].name


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_ignores_other_focus_areas(  # noqa: PLR0913
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,
    focus_area,
    mapwide_focus_area,
    client,
):
    """Test that focus_area_id param ignores other active focus areas."""
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    # Enable rail on the focus area we query
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=rail_type)
    # Enable hospital on map-wide (should be ignored when querying specific focus area)
    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=hospital_type)

    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={focus_area.id}")
    data = response.json()

    # Should only return rail inside focus area, not hospitals from map-wide
    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == assets_for_scenario["rail_inside"].name


@pytest.mark.django_db
def test_scenario_assets_with_invalid_focus_area_id_returns_404(scenario, client):
    """Test that invalid focus_area_id returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fake_id}")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_wrong_scenario_returns_404(
    scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that focus_area_id for different scenario returns 404."""
    # Create another scenario
    other_scenario = Scenario.objects.create(
        id=uuid.uuid4(),
        name="Other Scenario",
        is_active=False,
    )

    # Try to access focus area from wrong scenario
    url = f"/api/scenarios/{other_scenario.id}/assets/?focus_area_id={focus_area.id}"
    response = client.get(url)
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_wrong_user_returns_404(
    scenario,
    asset_types_for_scenario,
    client,
):
    """Test that focus_area_id for different user returns 404."""
    other_user_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    rail_type = asset_types_for_scenario["rail"]

    # Create focus area for another user
    other_fa = FocusArea.objects.create(
        scenario=scenario,
        user_id=other_user_id,
        name="Other User FA",
        geometry=GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))"),
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    VisibleAsset.objects.create(focus_area=other_fa, asset_type=rail_type)

    # Current user shouldn't be able to access it
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={other_fa.id}")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_no_visibility_returns_empty(
    scenario,
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that focus_area_id with no visible assets returns empty."""
    # Don't add any VisibleAsset records
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={focus_area.id}")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_by_score_only_mode(
    scenario,
    score_test_types,
    score_test_assets,
    mock_user_id,
    client,
):
    """Test focus_area_id with by_score_only mode returns scored assets."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Create focus area with by_score_only mode
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    fa = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Score Only FA",
        geometry=geom,
        filter_mode="by_score_only",
        is_active=True,
        is_system=False,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa.id}")
    data = response.json()

    # Both scored assets are inside geometry
    assert response.status_code == http_success_code
    assert len(data) == 2
    names = [a["name"] for a in data]
    assert score_test_assets["station"].name in names
    assert score_test_assets["pylon"].name in names


@pytest.mark.django_db
def test_scenario_assets_with_focus_area_id_and_score_filter(
    scenario,
    score_test_types,
    score_test_assets,
    mock_user_id,
    client,
):
    """Test focus_area_id with score filter applies the filter correctly."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records with different criticality scores
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Create focus area with by_score_only mode and global filter
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    fa = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Filtered Score FA",
        geometry=geom,
        filter_mode="by_score_only",
        is_active=True,
        is_system=False,
    )
    # Only allow criticality=3
    AssetScoreFilter.objects.create(focus_area=fa, asset_type=None, criticality_values=[3])

    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa.id}")
    data = response.json()

    # Only station (criticality=3) should be returned
    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == score_test_assets["station"].name


@pytest.mark.django_db
def test_scenario_assets_with_mapwide_focus_area_id(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,
    mapwide_focus_area,
    client,
):
    """Test focus_area_id works with map-wide focus area (no geometry)."""
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=rail_type)

    url = f"/api/scenarios/{scenario.id}/assets/?focus_area_id={mapwide_focus_area.id}"
    response = client.get(url)
    data = response.json()

    # Should return all rail assets (no geometry filter)
    assert response.status_code == http_success_code
    assert len(data) == 2
    names = [a["name"] for a in data]
    assert assets_for_scenario["rail_inside"].name in names
    assert assets_for_scenario["rail_outside"].name in names


@pytest.mark.django_db
def test_scenario_assets_map_wide_visibility(
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    mapwide_focus_area,
    client,
):
    """Test that map-wide visibility returns all assets of that type."""
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
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
    rail_type = asset_types_for_scenario["rail"]

    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == "Rail Station Inside"


@pytest.mark.django_db
def test_scenario_assets_combined_visibility(  # noqa: PLR0913
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    mapwide_focus_area,
    focus_area,
    client,
):
    """Test combining map-wide and focus area visibility.

    Map-wide assets should NOT appear inside active focus areas.
    Focus area assets are handled by the focus area's own visibility settings.
    """
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=rail_type,
    )
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=hospital_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    # Map-wide rail: only Rail Station Outside (inside is excluded by focus area)
    # Focus area hospital: Hospital Inside
    # Total: 2 assets
    expected_combined_count = 2
    assert response.status_code == http_success_code
    assert len(data) == expected_combined_count
    names = [a["name"] for a in data]
    assert "Rail Station Inside" not in names  # Inside focus area, excluded from map-wide
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
    rail_type = asset_types_for_scenario["rail"]

    # Set focus area to inactive
    focus_area.is_active = False
    focus_area.save()

    VisibleAsset.objects.create(
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

    # Create focus area for another user
    other_mapwide = FocusArea.objects.create(
        scenario=scenario,
        user_id=other_user_id,
        name="Map-wide",
        geometry=None,
        is_system=True,
    )
    VisibleAsset.objects.create(
        focus_area=other_mapwide,
        asset_type=rail_type,
    )

    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_scenario_assets_map_wide_inactive(  # noqa: PLR0913
    scenario,
    asset_types_for_scenario,
    assets_for_scenario,  # noqa: ARG001
    mapwide_focus_area,
    focus_area,
    client,
):
    """Test that when map-wide is_active=False, only focus area assets are returned."""
    rail_type = asset_types_for_scenario["rail"]
    hospital_type = asset_types_for_scenario["hospital"]

    # Enable map-wide for rail
    VisibleAsset.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=rail_type,
    )
    # Enable focus-area for hospital
    VisibleAsset.objects.create(
        focus_area=focus_area,
        asset_type=hospital_type,
    )

    # With map-wide active (default): should return 2 (Rail Outside + Hospital Inside)
    # Rail Inside is excluded because it's inside focus area
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    expected_total_count = 2
    assert len(data) == expected_total_count

    # Set map-wide to inactive
    mapwide_focus_area.is_active = False
    mapwide_focus_area.save()

    # Now should only return hospital inside focus area
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
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
def test_asset_types_focus_area_does_not_filter_by_geometry(
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
    assert "Hospitals" in names


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
@pytest.mark.django_db
def test_asset_types_focus_area_invalid_returns_404(scenario, client):
    """Test that invalid focus_area_id returns 404."""
    fake_focus_area_id = uuid.uuid4()
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={fake_focus_area_id}"
    )
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_asset_types_includes_asset_count_in_focus_area_map_wide(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001
    client,
):
    """Test that map-wide asset types include correct assetCount."""
    response = client.get(f"/api/scenarios/{scenario.id}/asset-types/")
    data = response.json()

    assert response.status_code == http_success_code

    rail_type = find_asset_type_in_tree(data, "Rail Stations")
    hospital_type = find_asset_type_in_tree(data, "Hospitals")

    assert rail_type is not None
    assert hospital_type is not None
    # assets_for_scenario creates 2 assets each for rail and hospital
    expected_asset_count_per_type_map_wide = 2
    # for map-wide, total assets should equal asset count in focus area
    assert rail_type["assetCountTotal"] == expected_asset_count_per_type_map_wide
    assert rail_type["assetCountInFocusArea"] == expected_asset_count_per_type_map_wide
    assert hospital_type["assetCountTotal"] == expected_asset_count_per_type_map_wide
    assert hospital_type["assetCountInFocusArea"] == expected_asset_count_per_type_map_wide


@pytest.mark.django_db
def test_asset_types_includes_asset_count_focus_area(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that focus area asset types include only assets within geometry."""
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code

    rail_type = find_asset_type_in_tree(data, "Rail Stations")
    hospital_type = find_asset_type_in_tree(data, "Hospitals")

    assert rail_type is not None
    assert hospital_type is not None
    # assets_for_scenario creates 1 inside and 1 outside for each type
    expected_count_inside = 1
    assert rail_type["assetCountInFocusArea"] == expected_count_inside
    assert hospital_type["assetCountInFocusArea"] == expected_count_inside


@pytest.mark.django_db
def test_asset_types_includes_total_asset_count_focus_area(
    scenario,
    asset_types_for_scenario,  # noqa: ARG001
    assets_for_scenario,  # noqa: ARG001
    focus_area,
    client,
):
    """Test that focus area asset types include only assets within geometry."""
    response = client.get(
        f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={focus_area.id}"
    )
    data = response.json()

    assert response.status_code == http_success_code

    rail_type = find_asset_type_in_tree(data, "Rail Stations")
    hospital_type = find_asset_type_in_tree(data, "Hospitals")

    assert rail_type is not None
    assert hospital_type is not None
    # assets_for_scenario creates 1 inside and 1 outside for each type
    expected_count_total = 2
    assert rail_type["assetCountTotal"] == expected_count_total
    assert hospital_type["assetCountTotal"] == expected_count_total


# =============================================================================
# Score Filtering Tests
# =============================================================================


@pytest.fixture
def score_test_types(db):  # noqa: ARG001
    """Create asset types for score filtering tests."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Score Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Score Test SubCategory", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Score Test Source")

    station_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Score Stations",
        sub_category=sub_category,
        data_source=data_source,
    )
    pylon_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Score Pylons",
        sub_category=sub_category,
        data_source=data_source,
    )
    hospital_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Score Hospitals",
        sub_category=sub_category,
        data_source=data_source,
    )

    return {
        "station": station_type,
        "pylon": pylon_type,
        "hospital": hospital_type,
    }


@pytest.fixture
def score_test_assets(db, score_test_types):  # noqa: ARG001
    """Create assets for score filtering tests."""
    station = score_test_types["station"]
    pylon = score_test_types["pylon"]

    station_asset = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station for Score Test",
        type=station,
        geom=Point(0.5, 0.5),
    )
    pylon_asset = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon for Score Test",
        type=pylon,
        geom=Point(0.5, 0.5),
    )

    return {
        "station": station_asset,
        "pylon": pylon_asset,
    }


@pytest.mark.django_db
def test_by_score_only_mode_returns_all_scored_assets(
    scenario,
    score_test_types,
    score_test_assets,
    mapwide_focus_area,
    client,
):
    """Test that by_score_only mode returns all assets that have scores."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records (populates asset_scores view)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Set map-wide to by_score_only mode
    mapwide_focus_area.filter_mode = "by_score_only"
    mapwide_focus_area.save()

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("by_score_only_mode_returns_all_scored_assets", ctx.captured_queries)

    assert response.status_code == http_success_code
    assert len(data) == 2
    names = [a["name"] for a in data]
    assert score_test_assets["station"].name in names
    assert score_test_assets["pylon"].name in names


@pytest.mark.django_db
def test_by_score_only_mode_with_global_criticality_filter(
    scenario,
    score_test_types,
    score_test_assets,
    mapwide_focus_area,
    client,
):
    """Test that global score filter in by_score_only mode filters by criticality."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records with different criticality scores
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Set map-wide to by_score_only mode
    mapwide_focus_area.filter_mode = "by_score_only"
    mapwide_focus_area.save()

    # Add global score filter (asset_type=None) for criticality=3 only
    AssetScoreFilter.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=None,
        criticality_values=[3],
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("by_score_only_mode_with_global_criticality_filter", ctx.captured_queries)

    # Only station (criticality=3) should be returned
    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == score_test_assets["station"].name


@pytest.mark.django_db
def test_by_asset_type_mode_with_per_type_score_filter(
    scenario,
    score_test_types,
    score_test_assets,
    mapwide_focus_area,
    client,
):
    """Test that per-type score filter only affects that type in by_asset_type mode."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Enable both types as visible (by_asset_type mode is default)
    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=station_type)
    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=pylon_type)

    # Add per-type score filter for stations requiring criticality=0 (no assets match)
    AssetScoreFilter.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=station_type,
        criticality_values=[0],
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("by_asset_type_mode_with_per_type_score_filter", ctx.captured_queries)

    # Only pylon should be returned (station filtered out by score filter)
    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == score_test_assets["pylon"].name


@pytest.mark.django_db
def test_focus_area_geometry_with_score_filter(
    scenario,
    score_test_types,
    mock_user_id,
    client,
):
    """Test that focus area with geometry AND score filter returns only matching assets."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create assets inside the focus area geometry
    station_inside = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station Inside Geom",
        type=station_type,
        geom=Point(0.5, 0.5),
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon Inside Geom",
        type=pylon_type,
        geom=Point(0.5, 0.5),
    )

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Create focus area with geometry
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Geom Area with Score",
        geometry=geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )

    # Enable both types
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=station_type)
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=pylon_type)

    # Add score filter requiring criticality=3 for stations
    AssetScoreFilter.objects.create(
        focus_area=focus_area,
        asset_type=station_type,
        criticality_values=[3],
    )
    # Add score filter requiring criticality=0 for pylons (no match)
    AssetScoreFilter.objects.create(
        focus_area=focus_area,
        asset_type=pylon_type,
        criticality_values=[0],
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("focus_area_geometry_with_score_filter", ctx.captured_queries)

    # Only station should be returned (pylon filtered out by score)
    assert response.status_code == http_success_code
    assert len(data) == 1
    assert data[0]["name"] == station_inside.name


@pytest.mark.django_db
def test_assets_inside_geometry_excluded_by_score_filter(
    scenario,
    score_test_types,
    mock_user_id,
    client,
):
    """Test that assets inside geometry are excluded when score filter doesn't match."""
    station_type = score_test_types["station"]

    # Create asset inside the focus area geometry
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station No Match",
        type=station_type,
        geom=Point(0.5, 0.5),
    )

    # Create ScenarioAsset with criticality=3
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)

    # Create focus area with geometry
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    focus_area = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Exclusion Test Area",
        geometry=geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )

    # Enable station type
    VisibleAsset.objects.create(focus_area=focus_area, asset_type=station_type)

    # Add score filter requiring criticality=0 (asset has criticality=3, won't match)
    AssetScoreFilter.objects.create(
        focus_area=focus_area,
        asset_type=station_type,
        criticality_values=[0],
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("assets_inside_geometry_excluded_by_score_filter", ctx.captured_queries)

    # No assets should be returned (score filter excludes the asset)
    assert response.status_code == http_success_code
    assert len(data) == 0


@pytest.mark.django_db
def test_score_filter_all_null_no_filtering(
    scenario,
    score_test_types,
    score_test_assets,
    mapwide_focus_area,
    client,
):
    """Test that score filter with all NULL criteria doesn't restrict results."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Enable both types
    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=station_type)
    VisibleAsset.objects.create(focus_area=mapwide_focus_area, asset_type=pylon_type)

    # Add score filter with all NULL criteria (should not filter anything)
    AssetScoreFilter.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=station_type,
        criticality_values=None,
        exposure_values=None,
        redundancy_values=None,
        dependency_min=None,
        dependency_max=None,
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("score_filter_all_null_no_filtering", ctx.captured_queries)

    # Both assets should be returned (NULL filter doesn't restrict)
    assert response.status_code == http_success_code
    assert len(data) == 2
    names = [a["name"] for a in data]
    assert score_test_assets["station"].name in names
    assert score_test_assets["pylon"].name in names


@pytest.mark.django_db
def test_complex_multi_focus_area_with_overlaps_and_filters(
    scenario,
    mock_user_id,
    client,
):
    """Test complex scenario with multiple focus areas, overlaps, and mixed filters.

    Setup:
    - 3 asset types: Stations (crit=3), Pylons (crit=1), Hospitals (crit=2)
    - Assets at 4 positions:
      - Position A (0.5, 0.5): inside FA1 only
      - Position B (1.5, 0.5): inside FA2 only
      - Position C (0.8, 0.8): inside BOTH FA1 and FA2 (overlap)
      - Position D (5.0, 5.0): outside all focus areas (map-wide)
    - FA1 (0,0 to 1,1): by_asset_type, visible=[Stations], score filter crit=[3]
    - FA2 (0.5,0 to 2,1): by_asset_type, visible=[Pylons], no score filter
    - FA3: is_active=False (ignored)
    - Map-wide: by_score_only, global filter crit=[1,2]

    Expected:
    - FA1: Station at A (crit=3), Station at C (crit=3)
    - FA2: Pylon at B, Pylon at C
    - Map-wide: Pylon at D (crit=1), Hospital at D (crit=2)
    - NOT returned: Station at D (crit=3, filtered by map-wide)
    - NOT returned: Hospital at A/B (inside focus areas, not visible there)
    """
    # Create asset types
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Complex Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Complex Test SubCategory", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Complex Test Source")

    station_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Complex Stations",
        sub_category=sub_category,
        data_source=data_source,
    )
    pylon_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Complex Pylons",
        sub_category=sub_category,
        data_source=data_source,
    )
    hospital_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Complex Hospitals",
        sub_category=sub_category,
        data_source=data_source,
    )

    # Create ScenarioAsset records for scores
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=hospital_type, criticality_score=2)

    # Create assets at different positions
    # Position A (0.5, 0.5) - inside FA1 only
    station_a = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station A",
        type=station_type,
        geom=Point(0.5, 0.5),
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon A",
        type=pylon_type,
        geom=Point(0.5, 0.5),
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital A",
        type=hospital_type,
        geom=Point(0.5, 0.5),
    )

    # Position B (1.5, 0.5) - inside FA2 only
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station B",
        type=station_type,
        geom=Point(1.5, 0.5),
    )
    pylon_b = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon B",
        type=pylon_type,
        geom=Point(1.5, 0.5),
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital B",
        type=hospital_type,
        geom=Point(1.5, 0.5),
    )

    # Position C (0.8, 0.8) - inside BOTH FA1 and FA2 (overlap zone)
    station_c = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station C",
        type=station_type,
        geom=Point(0.8, 0.8),
    )
    pylon_c = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon C",
        type=pylon_type,
        geom=Point(0.8, 0.8),
    )

    # Position D (5.0, 5.0) - outside all focus areas (map-wide only)
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station D",
        type=station_type,
        geom=Point(5.0, 5.0),
    )
    pylon_d = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Pylon D",
        type=pylon_type,
        geom=Point(5.0, 5.0),
    )
    hospital_d = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Hospital D",
        type=hospital_type,
        geom=Point(5.0, 5.0),
    )

    # Create FA1 (0,0 to 1,1): by_asset_type, visible=[Stations], score filter crit=[3]
    fa1_geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    fa1 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="FA1",
        geometry=fa1_geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    VisibleAsset.objects.create(focus_area=fa1, asset_type=station_type)
    AssetScoreFilter.objects.create(focus_area=fa1, asset_type=station_type, criticality_values=[3])

    # Create FA2 (0.5,0 to 2,1): by_asset_type, visible=[Pylons], no score filter
    fa2_geom = GEOSGeometry("POLYGON((0.5 0, 0.5 1, 2 1, 2 0, 0.5 0))")
    fa2 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="FA2",
        geometry=fa2_geom,
        filter_mode="by_asset_type",
        is_active=True,
        is_system=False,
    )
    VisibleAsset.objects.create(focus_area=fa2, asset_type=pylon_type)

    # Create FA3: is_active=False (should be ignored)
    fa3_geom = GEOSGeometry("POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))")
    fa3 = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="FA3 Inactive",
        geometry=fa3_geom,
        filter_mode="by_asset_type",
        is_active=False,
        is_system=False,
    )
    # Even if we add visibility, it should be ignored
    VisibleAsset.objects.create(focus_area=fa3, asset_type=hospital_type)

    # Create Map-wide: by_score_only, global filter crit=[1,2]
    mapwide = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Map-wide",
        geometry=None,
        filter_mode="by_score_only",
        is_active=True,
        is_system=True,
    )
    AssetScoreFilter.objects.create(focus_area=mapwide, asset_type=None, criticality_values=[1, 2])

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()
    print_sql("complex_multi_focus_area_with_overlaps_and_filters", ctx.captured_queries)

    assert response.status_code == http_success_code

    names = sorted([a["name"] for a in data])
    expected_names = sorted(
        [
            station_a.name,  # FA1: Station at A (crit=3 matches filter)
            station_c.name,  # FA1: Station at C (crit=3 matches filter, in overlap)
            pylon_b.name,  # FA2: Pylon at B (no score filter)
            pylon_c.name,  # FA2: Pylon at C (no score filter, in overlap)
            pylon_d.name,  # Map-wide: Pylon at D (crit=1 matches [1,2])
            hospital_d.name,  # Map-wide: Hospital at D (crit=2 matches [1,2])
        ]
    )

    assert names == expected_names, f"Expected {expected_names}, got {names}"
    expected_count = 6
    assert len(data) == expected_count

    # Verify specific exclusions
    excluded_names = ["Station B", "Station D", "Pylon A", "Hospital A", "Hospital B"]
    for excluded in excluded_names:
        assert excluded not in names, f"{excluded} should not be in results"


@pytest.mark.django_db
def test_asset_types_filtered_count_equals_total_without_filter(
    scenario,
    score_test_types,
    score_test_assets,  # noqa: ARG001
    mapwide_focus_area,
    client,
):
    """Test that filteredAssetCount equals assetCount when no score filters exist."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(
            f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={mapwide_focus_area.id}"
        )
    data = response.json()
    print_sql("asset_types_filtered_count_equals_total_without_filter", ctx.captured_queries)

    assert response.status_code == http_success_code

    station_data = find_asset_type_in_tree(data, "Score Stations")
    pylon_data = find_asset_type_in_tree(data, "Score Pylons")

    assert station_data is not None
    assert pylon_data is not None
    # Without score filters, filteredAssetCount should equal assetCount
    assert station_data["filteredAssetCount"] == station_data["assetCountInFocusArea"]
    assert pylon_data["filteredAssetCount"] == pylon_data["assetCountInFocusArea"]


@pytest.mark.django_db
def test_asset_types_filtered_count_with_score_filter(
    scenario,
    score_test_types,
    score_test_assets,  # noqa: ARG001
    mapwide_focus_area,
    client,
):
    """Test that filteredAssetCount reflects score filter restrictions."""
    station_type = score_test_types["station"]
    pylon_type = score_test_types["pylon"]

    # Create additional station asset to have 2 total
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Station 2 for Filter Count",
        type=station_type,
        geom=Point(1.0, 1.0),
    )

    # Create ScenarioAsset records
    ScenarioAsset.objects.create(scenario=scenario, asset_type=station_type, criticality_score=3)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=pylon_type, criticality_score=1)

    # Add score filter for station requiring criticality=0 (no assets match)
    AssetScoreFilter.objects.create(
        focus_area=mapwide_focus_area,
        asset_type=station_type,
        criticality_values=[0],
    )

    with CaptureQueriesContext(connection) as ctx:
        response = client.get(
            f"/api/scenarios/{scenario.id}/asset-types/?focus_area_id={mapwide_focus_area.id}"
        )
    data = response.json()
    print_sql("asset_types_filtered_count_with_score_filter", ctx.captured_queries)

    assert response.status_code == http_success_code

    station_data = find_asset_type_in_tree(data, "Score Stations")
    pylon_data = find_asset_type_in_tree(data, "Score Pylons")

    assert station_data is not None
    assert pylon_data is not None

    # Station has score filter with criticality=0, but assets have criticality=3
    # So filteredAssetCount should be 0
    expected_station_asset_count = 2
    assert station_data["assetCountInFocusArea"] == expected_station_asset_count
    assert station_data["filteredAssetCount"] == 0

    # Pylon has no score filter, so filteredAssetCount equals assetCount
    assert pylon_data["filteredAssetCount"] == pylon_data["assetCountInFocusArea"]


@pytest.mark.django_db
def test_exposure_filter_uses_user_specific_scores(scenario, mock_user_id, client):
    """Test that exposure filtering uses user-specific scores over fallback null scores.

    The asset_scores view contains both user-specific rows (with actual exposure scores)
    and fallback NULL user rows (with exposure=0). This test verifies that the filter
    prioritizes user-specific scores when they exist.
    """
    # Create asset type and scenario asset
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Exposure Test Category")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Exposure Test SubCat", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Exposure Test Source")
    asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Exposure Test Assets",
        sub_category=sub_category,
        data_source=data_source,
    )
    ScenarioAsset.objects.create(scenario=scenario, asset_type=asset_type, criticality_score=3)

    # Create exposure layer polygon centered at origin
    exposure_poly = Polygon(
        ((-0.001, -0.001), (0.001, -0.001), (0.001, 0.001), (-0.001, 0.001), (-0.001, -0.001))
    )
    exposure_layer_type = ExposureLayerType.objects.create(name="Test Flood")
    exposure_layer = ExposureLayer.objects.create(
        geometry=exposure_poly,
        geometry_buffered=buffer_geometry(exposure_poly),
        type=exposure_layer_type,
    )

    # Create asset INSIDE exposure layer (should get exposure score = 2)
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Inside Exposure",
        type=asset_type,
        geom=Point(0.0, 0.0),  # Inside the exposure polygon
    )

    # Create asset OUTSIDE exposure layer (should get exposure score = 0)
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Outside Exposure",
        type=asset_type,
        geom=Point(1.0, 1.0),  # Well outside the exposure polygon
    )

    # Create focus area with by_score_only mode and exposure filter = [0]
    fa = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Exposure Filter Test FA",
        geometry=None,  # Map-wide
        filter_mode="by_score_only",
        is_active=True,
        is_system=True,
    )

    # Link exposure layer to this focus area (for this user)
    VisibleExposureLayer.objects.create(focus_area=fa, exposure_layer=exposure_layer)

    # Create global score filter requiring exposure = 0 only
    AssetScoreFilter.objects.create(focus_area=fa, asset_type=None, exposure_values=[0])

    # Query assets with exposure filter
    response = client.get(f"/api/scenarios/{scenario.id}/assets/")
    data = response.json()

    assert response.status_code == http_success_code

    # Only asset_outside should be returned (exposure=0 for user with visible exposure layer)
    # asset_inside has exposure=2 for this user (inside 1 exposure layer) and should be excluded
    returned_names = [a["name"] for a in data]
    assert len(data) == 1, f"Expected 1 asset, got {len(data)}: {returned_names}"
    assert data[0]["name"] == "Asset Outside Exposure"


@pytest.mark.django_db
def test_exposure_score_scoped_to_focus_area(scenario, mock_user_id, client):
    """Exposure score should only count layers enabled for the queried focus area.

    This tests the bug: when querying map-wide with no exposure layers enabled,
    assets were incorrectly getting exposure scores from layers enabled on
    other focus areas.
    """
    # Create asset type and scenario asset
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Scoped Exposure Cat")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Scoped Exposure SubCat", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Scoped Exposure Source")
    asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Scoped Exposure Assets",
        sub_category=sub_category,
        data_source=data_source,
    )
    ScenarioAsset.objects.create(scenario=scenario, asset_type=asset_type, criticality_score=3)

    # Create exposure layer polygon
    exposure_poly = Polygon(
        ((-0.001, -0.001), (0.001, -0.001), (0.001, 0.001), (-0.001, 0.001), (-0.001, -0.001))
    )
    exposure_layer_type = ExposureLayerType.objects.create(name="Scoped Flood")
    exposure_layer = ExposureLayer.objects.create(
        geometry=exposure_poly,
        geometry_buffered=buffer_geometry(exposure_poly),
        type=exposure_layer_type,
    )

    # Create asset INSIDE exposure layer
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Inside Scoped",
        type=asset_type,
        geom=Point(0.0, 0.0),
    )

    # Create map-wide focus area with NO exposure layers enabled
    # Filter to only show assets with exposure score = 3
    fa_map_wide = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Map Wide No Exposure",
        geometry=None,
        filter_mode="by_score_only",
        is_active=True,
        is_system=True,
    )
    # This filter requires exposure score = 3, but since no exposure layers are
    # enabled on this focus area, all assets should have exposure = 0
    AssetScoreFilter.objects.create(focus_area=fa_map_wide, asset_type=None, exposure_values=[3])
    # NO VisibleExposureLayer for fa_map_wide

    # Create focus area B WITH exposure layer enabled
    fa_b_geometry = Polygon(((-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1)))
    fa_b = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Focus Area B With Exposure",
        geometry=fa_b_geometry,
        filter_mode="by_asset_type",
        is_active=True,
    )
    VisibleExposureLayer.objects.create(focus_area=fa_b, exposure_layer=exposure_layer)
    VisibleAsset.objects.create(focus_area=fa_b, asset_type=asset_type)

    # Query map-wide: should return NO assets because:
    # - Map-wide has no exposure layers enabled
    # - Therefore all assets have exposure_score = 0 for map-wide
    # - But the filter requires exposure_score = 3
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa_map_wide.id}")
    data = response.json()

    assert response.status_code == http_success_code
    assert len(data) == 0, (
        f"Map-wide should return no assets when filtering exposure=3, got: {data}"
    )


@pytest.mark.django_db
def test_same_asset_different_exposure_per_focus_area(scenario, mock_user_id, client):
    """Same asset should have different exposure scores depending on which focus area is queried."""
    # Create asset type and scenario asset
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Multi FA Cat")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Multi FA SubCat", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Multi FA Source")
    asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Multi FA Assets",
        sub_category=sub_category,
        data_source=data_source,
    )
    ScenarioAsset.objects.create(scenario=scenario, asset_type=asset_type, criticality_score=3)

    # Create two exposure layer polygons that both contain the asset
    exposure_poly_1 = Polygon(
        ((-0.002, -0.002), (0.002, -0.002), (0.002, 0.002), (-0.002, 0.002), (-0.002, -0.002))
    )
    exposure_poly_2 = Polygon(
        ((-0.003, -0.003), (0.003, -0.003), (0.003, 0.003), (-0.003, 0.003), (-0.003, -0.003))
    )
    exposure_layer_type = ExposureLayerType.objects.create(name="Multi FA Flood")
    exposure_layer_1 = ExposureLayer.objects.create(
        geometry=exposure_poly_1,
        geometry_buffered=buffer_geometry(exposure_poly_1),
        type=exposure_layer_type,
    )
    exposure_layer_2 = ExposureLayer.objects.create(
        geometry=exposure_poly_2,
        geometry_buffered=buffer_geometry(exposure_poly_2),
        type=exposure_layer_type,
    )

    # Create asset inside both exposure layers
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Multi FA",
        type=asset_type,
        geom=Point(0.0, 0.0),
    )

    # FA A: only exposure_layer_1 enabled -> exposure score = 2 (intersects 1 layer)
    fa_a = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="FA A One Layer",
        geometry=None,
        filter_mode="by_score_only",
        is_active=True,
    )
    VisibleExposureLayer.objects.create(focus_area=fa_a, exposure_layer=exposure_layer_1)
    # Filter: only show assets with exposure = 2
    AssetScoreFilter.objects.create(focus_area=fa_a, asset_type=None, exposure_values=[2])

    # FA B: both exposure layers enabled -> exposure score = 3 (intersects 2+ layers)
    fa_b = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="FA B Two Layers",
        geometry=None,
        filter_mode="by_score_only",
        is_active=True,
    )
    VisibleExposureLayer.objects.create(focus_area=fa_b, exposure_layer=exposure_layer_1)
    VisibleExposureLayer.objects.create(focus_area=fa_b, exposure_layer=exposure_layer_2)
    # Filter: only show assets with exposure = 3
    AssetScoreFilter.objects.create(focus_area=fa_b, asset_type=None, exposure_values=[3])

    # Query FA A with exposure=2 filter: should return asset
    response_a = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa_a.id}")
    data_a = response_a.json()
    assert response_a.status_code == http_success_code
    assert len(data_a) == 1, f"FA A (exposure=2) should return 1 asset, got: {data_a}"

    # Query FA B with exposure=3 filter: should return asset
    response_b = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa_b.id}")
    data_b = response_b.json()
    assert response_b.status_code == http_success_code
    assert len(data_b) == 1, f"FA B (exposure=3) should return 1 asset, got: {data_b}"


@pytest.mark.django_db
def test_exposure_filter_with_multiple_values_including_zero(scenario, mock_user_id, client):
    """Filter exposure_values=[0, 2] should return assets with score 0 OR 2.

    This tests the OR logic in _build_exposure_filter_q when filtering for
    both "not near any exposure layer" (score=0) and "inside one layer" (score=2).
    """
    # Create asset type and scenario asset
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Multi Exposure Cat")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Multi Exposure SubCat", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Multi Exposure Source")
    asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Multi Exposure Assets",
        sub_category=sub_category,
        data_source=data_source,
    )
    ScenarioAsset.objects.create(scenario=scenario, asset_type=asset_type, criticality_score=3)

    # Create exposure layer polygon centered at origin
    exposure_poly = Polygon(
        ((-0.001, -0.001), (0.001, -0.001), (0.001, 0.001), (-0.001, 0.001), (-0.001, -0.001))
    )
    exposure_layer_type = ExposureLayerType.objects.create(name="Multi Exposure Flood")
    exposure_layer = ExposureLayer.objects.create(
        geometry=exposure_poly,
        geometry_buffered=buffer_geometry(exposure_poly),
        type=exposure_layer_type,
    )

    # Create 3 assets:
    # 1. Inside exposure layer (score=2)
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Inside (score=2)",
        type=asset_type,
        geom=Point(0.0, 0.0),  # Inside the polygon
    )
    # 2. Near but not inside (score=1) - within 500m but not intersecting
    # 0.003 degrees ≈ 333m at equator
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Near (score=1)",
        type=asset_type,
        geom=Point(0.003, 0.0),  # Near but outside
    )
    # 3. Far away (score=0) - not within 500m
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Asset Far (score=0)",
        type=asset_type,
        geom=Point(1.0, 1.0),  # Far away
    )

    # Create focus area with exposure layer enabled
    fa = FocusArea.objects.create(
        scenario=scenario,
        user_id=mock_user_id,
        name="Multi Value Exposure FA",
        geometry=None,
        filter_mode="by_score_only",
        is_active=True,
    )
    VisibleExposureLayer.objects.create(focus_area=fa, exposure_layer=exposure_layer)

    # Filter: exposure_values=[0, 2] - should return assets with score 0 OR 2
    # This means: asset_inside (score=2) and asset_far (score=0), NOT asset_near (score=1)
    AssetScoreFilter.objects.create(focus_area=fa, asset_type=None, exposure_values=[0, 2])

    # Query
    response = client.get(f"/api/scenarios/{scenario.id}/assets/?focus_area_id={fa.id}")
    data = response.json()

    assert response.status_code == http_success_code
    returned_names = {a["name"] for a in data}
    assert len(data) == 2, f"Expected 2 assets, got {len(data)}: {returned_names}"
    assert "Asset Inside (score=2)" in returned_names
    assert "Asset Far (score=0)" in returned_names
    assert "Asset Near (score=1)" not in returned_names
