"""Tests for the assets endpoints."""

import uuid

import pytest
from django.contrib.gis.geos import Point

from api.models.asset import Asset
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType
from api.models.data_source import DataSource
from api.models.group import Group, GroupDataSourceAccess, GroupMembership

http_success_code = 200
http_forbidden = 403


@pytest.mark.django_db
def test_list_assets(assets, client):
    """Test that the list function works as expected."""
    expected_names = [asset.name for asset in assets]

    response = client.get("/api/assets/")
    data = response.json()
    actual_names = [asset["name"] for asset in data]

    assert response.status_code == http_success_code
    assert len(data) == len(expected_names)
    assert set(actual_names) == set(expected_names)


@pytest.mark.django_db
def test_list_assets_by_(assets, client):
    """Test that the list function allows filtering by asset type."""
    asset = assets[0]
    expected_asset_names = [_asset.name for _asset in assets if _asset.type_id == asset.type_id]

    response = client.get(f"/api/assets/?asset_type={asset.type_id}")
    data = response.json()
    actual_asset_names = [asset["name"] for asset in data]

    assert response.status_code == http_success_code
    assert len(data) == len(expected_asset_names)
    assert set(actual_asset_names) == set(expected_asset_names)


@pytest.mark.django_db
def test_get_assets(full_data, client):
    """Test that the get function returns metadata and dependency."""
    asset = full_data["assets"][0]
    response = client.get(f"/api/assets/{asset.id}/")
    data = response.json()

    expected_dependent = next(
        dependency.dependent_asset
        for dependency in full_data["dependencies"]
        if dependency.provider_asset.external_id == asset.external_id
    )
    expected_provider = next(
        dependency.provider_asset
        for dependency in full_data["dependencies"]
        if dependency.dependent_asset.external_id == asset.external_id
    )
    assert response.status_code == http_success_code
    assert data["name"] == asset.name
    assert data["geom"] == asset.geom
    _check_asset(expected_provider, data["providers"][0])
    _check_asset(expected_dependent, data["dependents"][0])


def _check_asset(expected, result):
    assert expected.name == result["name"]
    assert expected.geom == result["geom"]


@pytest.mark.django_db
def test_resolve_external_id(assets, client):
    """Test resolving assets by external ID."""
    asset = assets[0]

    response = client.get(f"/api/assets/resolve-external-id/?external_id={asset.external_id}")
    data = response.json()

    assert response.status_code == http_success_code
    assert data["id"] == str(asset.id)
    assert data["name"] == asset.name


@pytest.mark.django_db
def test_resolve_external_id_not_found(client):
    """Test resolve endpoint returns 404 for unknown external ID."""
    response = client.get("/api/assets/resolve-external-id/?external_id=missing-id")

    assert response.status_code == 404


@pytest.mark.django_db
def test_resolve_external_id_requires_query_param(client):
    """Test resolve endpoint validates required query parameter."""
    response = client.get("/api/assets/resolve-external-id/")

    assert response.status_code == 400


@pytest.fixture
def restricted_asset_with_group_access(db):  # noqa: ARG001
    """Asset with type's data source restricted to a group; returns asset and user IDs."""
    allowed_user_id = uuid.uuid4()
    data_source = DataSource.objects.create(name="Restricted Source", owner="Owner")
    group = Group.objects.create(name="Allowed Group", created_by=allowed_user_id)
    GroupMembership.objects.create(group=group, user_id=allowed_user_id, created_by=allowed_user_id)
    GroupDataSourceAccess.objects.create(data_source=data_source, group=group)

    category = AssetCategory.objects.create(name="Cat")
    sub_category = AssetSubCategory.objects.create(name="Sub", category=category)
    asset_type = AssetType.objects.create(
        name="Restricted Type", data_source=data_source, sub_category=sub_category
    )
    asset = Asset.objects.create(
        name="Restricted Asset",
        external_id=uuid.uuid4(),
        geom=Point(0.5, 0.5),
        type=asset_type,
    )
    return {
        "asset": asset,
        "allowed_user_id": allowed_user_id,
        "disallowed_user_id": uuid.uuid4(),
    }


@pytest.mark.django_db
def test_retrieve_returns_403_when_user_lacks_data_source_access(
    restricted_asset_with_group_access, client, monkeypatch
):
    """Asset detail returns 403 when data source is restricted and user not in allowed group."""
    asset = restricted_asset_with_group_access["asset"]
    disallowed_user_id = restricted_asset_with_group_access["disallowed_user_id"]

    monkeypatch.setattr(
        "api.views.assets.get_user_id_from_request",
        lambda _request: disallowed_user_id,
    )

    response = client.get(f"/api/assets/{asset.id}/")

    assert response.status_code == http_forbidden
    data = response.json()
    assert "detail" in data
    assert "do not have permission" in data["detail"].lower()


@pytest.mark.django_db
def test_resolve_external_id_returns_403_when_user_lacks_data_source_access(
    restricted_asset_with_group_access, client, monkeypatch
):
    """Resolve external ID returns 403 when data source restricted and user not in allowed group."""
    asset = restricted_asset_with_group_access["asset"]
    disallowed_user_id = restricted_asset_with_group_access["disallowed_user_id"]

    monkeypatch.setattr(
        "api.views.assets.get_user_id_from_request",
        lambda _request: disallowed_user_id,
    )

    response = client.get(f"/api/assets/resolve-external-id/?external_id={asset.external_id}")

    assert response.status_code == http_forbidden
    data = response.json()
    assert "detail" in data
    assert "do not have permission" in data["detail"].lower()
