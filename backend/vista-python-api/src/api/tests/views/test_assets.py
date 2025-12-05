"""Tests for the assets endpoints."""

import pytest

from api.urls import router

http_success_code = 200


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
