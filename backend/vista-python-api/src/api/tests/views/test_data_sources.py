"""Tests for the data sources endpoints."""

import pytest

http_success_code = 200


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
