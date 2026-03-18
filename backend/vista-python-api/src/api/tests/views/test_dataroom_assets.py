# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the dataroom asset endpoints."""

import json
import uuid

import pytest
from django.contrib.gis.geos import Point

from api.models.asset import Asset
from api.models.asset_criticality_override import AssetCriticalityOverride
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.scenario_asset import ScenarioAsset

http_ok = 200
http_bad_request = 400
http_forbidden = 403
http_not_found = 404


class Administrator:
    """Mock administrator permission that denies access."""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return False to simulate non-admin."""
        return False


@pytest.fixture
def dataroom_data(scenario, db):  # noqa: ARG001
    """Create test data for dataroom endpoints."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Infrastructure")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Transport", category=category
    )
    data_source = DataSource.objects.create(id=uuid.uuid4(), name="Test Source")
    asset_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Rail Stations",
        sub_category=sub_category,
        data_source=data_source,
    )
    another_type = AssetType.objects.create(
        id=uuid.uuid4(),
        name="Bus Stops",
        sub_category=sub_category,
        data_source=data_source,
    )

    ScenarioAsset.objects.create(scenario=scenario, asset_type=asset_type, criticality_score=2)
    ScenarioAsset.objects.create(scenario=scenario, asset_type=another_type, criticality_score=1)

    asset_1 = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="London Paddington",
        type=asset_type,
        geom=Point(0.5, 0.5),
    )
    asset_2 = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="London Victoria",
        type=asset_type,
        geom=Point(1.5, 1.5),
    )
    asset_3 = Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Oxford Bus Station",
        type=another_type,
        geom=Point(0.5, 0.5),
    )

    return {
        "category": category,
        "sub_category": sub_category,
        "asset_type": asset_type,
        "another_type": another_type,
        "asset_1": asset_1,
        "asset_2": asset_2,
        "asset_3": asset_3,
    }


# --- GET Tests ---


@pytest.mark.django_db
def test_get_dataroom_assets_returns_all_scored_assets(scenario, dataroom_data, client):
    """Test GET returns all assets whose type has a ScenarioAsset row."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 3

    ids = {item["id"] for item in data}
    assert str(dataroom_data["asset_1"].id) in ids
    assert str(dataroom_data["asset_2"].id) in ids
    assert str(dataroom_data["asset_3"].id) in ids


@pytest.mark.django_db
def test_get_dataroom_assets_returns_type_level_criticality(scenario, dataroom_data, client):
    """Test GET returns the type-level criticality score when no override exists."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/")
    data = response.json()

    asset_1_data = next(d for d in data if d["id"] == str(dataroom_data["asset_1"].id))
    assert asset_1_data["criticalityScore"] == 2
    assert asset_1_data["criticalityIsOverridden"] is False
    assert asset_1_data["assetTypeName"] == "Rail Stations"
    assert asset_1_data["subCategoryName"] == "Transport"
    assert asset_1_data["categoryName"] == "Infrastructure"


@pytest.mark.django_db
def test_get_dataroom_assets_returns_overridden_criticality(scenario, dataroom_data, client):
    """Test GET returns the override criticality score when one exists."""
    AssetCriticalityOverride.objects.create(
        scenario=scenario,
        asset=dataroom_data["asset_1"],
        criticality_score=3,
        created_by=uuid.uuid4(),
        updated_by=uuid.uuid4(),
    )

    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/")
    data = response.json()

    asset_1_data = next(d for d in data if d["id"] == str(dataroom_data["asset_1"].id))
    assert asset_1_data["criticalityScore"] == 3
    assert asset_1_data["criticalityIsOverridden"] is True


@pytest.mark.django_db
def test_get_dataroom_assets_filter_by_category(scenario, dataroom_data, client):
    """Test GET filters by category_id."""
    cat_id = dataroom_data["category"].id
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/?category_id={cat_id}")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 3


@pytest.mark.django_db
def test_get_dataroom_assets_filter_by_sub_category(scenario, dataroom_data, client):
    """Test GET filters by sub_category_id."""
    sub_cat_id = dataroom_data["sub_category"].id
    response = client.get(
        f"/api/scenarios/{scenario.id}/dataroom/assets/?sub_category_id={sub_cat_id}"
    )
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 3


@pytest.mark.django_db
def test_get_dataroom_assets_filter_by_asset_type(scenario, dataroom_data, client):
    """Test GET filters by asset_type_id."""
    type_id = dataroom_data["asset_type"].id
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/?asset_type_id={type_id}")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 2
    ids = {item["id"] for item in data}
    assert str(dataroom_data["asset_1"].id) in ids
    assert str(dataroom_data["asset_2"].id) in ids


@pytest.mark.django_db
def test_get_dataroom_assets_filter_by_search(scenario, dataroom_data, client):
    """Test GET filters by search term."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/?search=Paddington")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 1
    assert data[0]["id"] == str(dataroom_data["asset_1"].id)


@pytest.mark.django_db
def test_get_dataroom_assets_search_by_type_name(scenario, dataroom_data, client):
    """Test GET search matches asset type name."""
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/?search=Bus")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 1
    assert data[0]["id"] == str(dataroom_data["asset_3"].id)


@pytest.mark.django_db
def test_get_dataroom_assets_filter_by_geometry(scenario, dataroom_data, client):
    """Test GET filters by geometry polygon."""
    geojson = json.dumps(
        {
            "type": "Polygon",
            "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
        }
    )
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/?geometry={geojson}")
    data = response.json()

    assert response.status_code == http_ok
    assert len(data) == 2
    ids = {item["id"] for item in data}
    assert str(dataroom_data["asset_1"].id) in ids
    assert str(dataroom_data["asset_3"].id) in ids


@pytest.mark.django_db
def test_get_dataroom_assets_excludes_unscored_types(scenario, db, client):  # noqa: ARG001
    """Test GET excludes assets whose type has no ScenarioAsset row."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Unscored Cat")
    sub_cat = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Unscored Sub", category=category
    )
    unscored_type = AssetType.objects.create(
        id=uuid.uuid4(), name="Unscored Type", sub_category=sub_cat
    )
    Asset.objects.create(
        id=uuid.uuid4(),
        external_id=uuid.uuid4(),
        name="Unscored Asset",
        type=unscored_type,
        geom=Point(0.5, 0.5),
    )

    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/")
    data = response.json()

    names = [item["name"] for item in data]
    assert "Unscored Asset" not in names


@pytest.mark.django_db
def test_get_dataroom_assets_invalid_scenario_returns_404(client):
    """Test GET with invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/scenarios/{fake_id}/dataroom/assets/")
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_get_dataroom_assets_returns_403_for_non_admin(scenario, client, monkeypatch):
    """Test GET returns 403 when user is not admin."""
    monkeypatch.setattr("api.views.dataroom_assets.Administrator", Administrator)
    response = client.get(f"/api/scenarios/{scenario.id}/dataroom/assets/")
    assert response.status_code == http_forbidden


# --- PUT Tests ---


@pytest.mark.django_db
def test_put_creates_criticality_overrides(scenario, dataroom_data, client):
    """Test PUT creates new override records."""
    updates = [
        {"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 3},
        {"assetId": str(dataroom_data["asset_2"].id), "criticalityScore": 3},
    ]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )
    data = response.json()

    assert response.status_code == http_ok
    assert data["updatedCount"] == 2
    assert (
        AssetCriticalityOverride.objects.filter(scenario=scenario, criticality_score=3).count() == 2
    )


@pytest.mark.django_db
def test_put_updates_existing_overrides(scenario, dataroom_data, client):
    """Test PUT updates existing override records."""
    AssetCriticalityOverride.objects.create(
        scenario=scenario,
        asset=dataroom_data["asset_1"],
        criticality_score=1,
        created_by=uuid.uuid4(),
        updated_by=uuid.uuid4(),
    )

    updates = [{"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 3}]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    override = AssetCriticalityOverride.objects.get(
        scenario=scenario, asset=dataroom_data["asset_1"]
    )
    assert override.criticality_score == 3


@pytest.mark.django_db
def test_put_preserves_created_fields_on_update(scenario, dataroom_data, client):
    """Test PUT preserves created_by and created_at but updates updated_by and updated_at."""
    original_creator = uuid.uuid4()
    original_updater = uuid.uuid4()
    override = AssetCriticalityOverride.objects.create(
        scenario=scenario,
        asset=dataroom_data["asset_1"],
        criticality_score=1,
        created_by=original_creator,
        updated_by=original_updater,
    )
    original_created_at = override.created_at
    original_updated_at = override.updated_at

    updates = [{"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 3}]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    override.refresh_from_db()
    dev_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    assert override.created_by == original_creator
    assert override.created_at == original_created_at
    assert override.updated_by == dev_user_id
    assert override.updated_at > original_updated_at


@pytest.mark.django_db
def test_put_mixed_create_and_update(scenario, dataroom_data, client):
    """Test PUT handles mix of new and existing overrides."""
    AssetCriticalityOverride.objects.create(
        scenario=scenario,
        asset=dataroom_data["asset_1"],
        criticality_score=1,
        created_by=uuid.uuid4(),
        updated_by=uuid.uuid4(),
    )

    updates = [
        {"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 0},
        {"assetId": str(dataroom_data["asset_2"].id), "criticalityScore": 0},
    ]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    assert (
        AssetCriticalityOverride.objects.filter(scenario=scenario, criticality_score=0).count() == 2
    )


@pytest.mark.django_db
def test_put_validates_criticality_range(scenario, dataroom_data, client):
    """Test PUT rejects criticality_score outside 0-3."""
    updates = [{"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 5}]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_put_validates_empty_updates(scenario, client):
    """Test PUT rejects empty updates list."""
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": []}),
        content_type="application/json",
    )
    assert response.status_code == http_bad_request


@pytest.mark.django_db
def test_put_different_scores_per_asset(scenario, dataroom_data, client):
    """Test PUT applies different scores to different assets in the same request."""
    updates = [
        {"assetId": str(dataroom_data["asset_1"].id), "criticalityScore": 3},
        {"assetId": str(dataroom_data["asset_2"].id), "criticalityScore": 1},
    ]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )

    assert response.status_code == http_ok
    assert response.json()["updatedCount"] == 2

    override_1 = AssetCriticalityOverride.objects.get(
        scenario=scenario, asset=dataroom_data["asset_1"]
    )
    override_2 = AssetCriticalityOverride.objects.get(
        scenario=scenario, asset=dataroom_data["asset_2"]
    )
    assert override_1.criticality_score == 3
    assert override_2.criticality_score == 1


@pytest.mark.django_db
def test_put_invalid_scenario_returns_404(client):
    """Test PUT with invalid scenario returns 404."""
    fake_id = uuid.uuid4()
    updates = [{"assetId": str(uuid.uuid4()), "criticalityScore": 1}]
    response = client.put(
        f"/api/scenarios/{fake_id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )
    assert response.status_code == http_not_found


@pytest.mark.django_db
def test_put_returns_403_for_non_admin(scenario, client, monkeypatch):
    """Test PUT returns 403 when user is not admin."""
    monkeypatch.setattr("api.views.dataroom_assets.Administrator", Administrator)
    updates = [{"assetId": str(uuid.uuid4()), "criticalityScore": 1}]
    response = client.put(
        f"/api/scenarios/{scenario.id}/dataroom/assets/criticality/",
        data=json.dumps({"updates": updates}),
        content_type="application/json",
    )
    assert response.status_code == http_forbidden
