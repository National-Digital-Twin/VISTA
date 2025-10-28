"""Tests for the assets endpoints."""

import pytest

from api.urls import router  # noqa: F401

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
def test_get_assets(assets, client):
    """Test that the get function allows filtering by asset type."""
    asset = assets[0]
    response = client.get(f"/api/assets/{asset.id}/")
    data = response.json()

    assert response.status_code == http_success_code
    assert set(data["name"]) == set(asset.name)
