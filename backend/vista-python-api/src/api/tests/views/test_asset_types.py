# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for the asset types endpoints."""

import pytest

http_success_code = 200


@pytest.mark.django_db
def test_list_asset_types(asset_types, client):
    """Test that the list function works as expected."""
    expected = [asset_type.name for asset_type in asset_types]

    response = client.get("/api/assettypes/")
    data = response.json()
    result = [asset_type["name"] for asset_type in data]

    assert response.status_code == http_success_code
    assert len(data) == len(expected)
    assert set(result) == set(expected)


@pytest.mark.django_db
def test_get_asset_types(asset_types, client):
    """Test that the list function works as expected."""
    asset_type = asset_types[0]
    response = client.get(f"/api/assettypes/{asset_type.id}/")
    assert response.status_code == http_success_code

    data = response.json()
    assert set(data["name"]) == set(asset_type.name)
