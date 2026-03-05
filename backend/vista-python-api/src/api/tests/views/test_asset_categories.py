# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the asset types endpoints."""

import pytest

http_success_code = 200


@pytest.mark.django_db
def test_list_asset_categories(asset_categories, client):
    """Test that the list function works as expected."""
    expected = [asset_type.name for asset_type in asset_categories]

    response = client.get("/api/assetcategories/")
    data = response.json()
    result = [asset_type["name"] for asset_type in data]

    assert response.status_code == http_success_code
    assert len(data) == len(expected)
    assert set(result) == set(expected)


@pytest.mark.django_db
def test_get_asset_categories(full_data, client):
    """Test that the list function works as expected."""
    asset_category = full_data["asset_categories"][0]
    response = client.get(f"/api/assetcategories/{asset_category.id}/")
    assert response.status_code == http_success_code

    data = response.json()
    assert set(data["name"]) == set(asset_category.name)
    assert data["subCategories"] is not None
    assert len(data["subCategories"]) > 0
    assert {subCategory["name"] for subCategory in data["subCategories"]} == {
        subCategory.name for subCategory in full_data["asset_subcategories"]
    }
