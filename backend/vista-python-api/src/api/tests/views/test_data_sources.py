"""Tests for the data sources endpoints."""

import pytest

http_success_code = 200
expected_attributes_ct = 6


@pytest.mark.django_db
def test_list_data_sources(data_sources, client):
    """Test that the list function works as expected."""
    expected = [data_source.name for data_source in data_sources]

    response = client.get("/api/datasources/")
    data = response.json()
    result = [data_source["name"] for data_source in data]

    assert response.status_code == http_success_code
    assert len(data) == len(expected)
    assert set(result) == set(expected)
    assert len(data[0].keys()) == expected_attributes_ct
    assert "name" in data[0]
    assert "owner" in data[0]
    assert "description" in data[0]
    assert "assetCount" in data[0]
    assert "lastUpdated" in data[0]
