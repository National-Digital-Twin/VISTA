"""Tests for the ExposureLayer API endpoint."""

import pytest
from django.contrib.gis.geos import GEOSGeometry
from api.models import ExposureLayer

http_success_code = 200


@pytest.fixture
def exposure_layers(db):
    """Create sample ExposureLayer objects in the test database."""

    geom1 = GEOSGeometry('POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))')
    geom2 = GEOSGeometry('POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))')

    layer1 = ExposureLayer.objects.create(
        name="Test layer 1",
        geometry=geom1
    )
    layer2 = ExposureLayer.objects.create(
        name="Test layer 2",
        geometry=geom2
    )
    return [layer1, layer2]


@pytest.mark.django_db
def test_list_exposure_layers(exposure_layers, client):
    """
    Test that the list function for exposure layers works as expected
    and returns a valid GeoJSON FeatureCollection.
    """
    expected_names = [layer.name for layer in exposure_layers]
    response = client.get("/api/exposurelayers/")
    data = response.json()

    assert "type" in data
    assert data["type"] == "FeatureCollection"

    features = data.get("features", [])
    result_names = [feature["properties"]["name"] for feature in features]

    assert response.status_code == http_success_code
    assert len(features) == len(expected_names)
    assert set(result_names) == set(expected_names)

@pytest.mark.django_db
def test_exposure_layer_str_method(exposure_layers):
    """Test that the __str__ method returns the model's name."""

    layer = exposure_layers[0]
    expected_name = "Test layer 1"
    result_str = str(layer)

    assert result_str == expected_name
    assert result_str == layer.name
