"""Tests for the ExposureLayer API endpoint."""

import pytest
from django.contrib.gis.geos import GEOSGeometry

from api.models import ExposureLayer, ExposureLayerType
from api.tests.conftest import buffer_geometry

http_success_code = 200


@pytest.fixture
def exposure_layers(db):  # noqa: ARG001
    """Create sample ExposureLayer objects in the test database."""
    type1 = ExposureLayerType.objects.create(name="Type 1")
    type2 = ExposureLayerType.objects.create(name="Type 2")
    geom1 = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    geom2 = GEOSGeometry("POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))")

    layer1 = ExposureLayer.objects.create(
        name="Test layer 1",
        geometry=geom1,
        geometry_buffered=buffer_geometry(geom1),
        type=type1,
    )
    layer2 = ExposureLayer.objects.create(
        name="Test layer 2",
        geometry=geom2,
        geometry_buffered=buffer_geometry(geom2),
        type=type2,
    )
    layer3 = ExposureLayer.objects.create(
        name="Test layer 3",
        geometry=geom2,
        geometry_buffered=buffer_geometry(geom2),
        type=type2,
    )
    return [layer1, layer2, layer3]


@pytest.mark.django_db
def test_list_exposure_layers(exposure_layers, client):
    """Test that the list function for exposure layers works as expected."""
    expected_type_names = {layer.type.name for layer in exposure_layers}

    response = client.get("/api/exposurelayers/")
    data = response.json()

    # Check healthy response
    assert response.status_code == http_success_code

    # Check types of layer are correct
    assert len(data) == len(expected_type_names)
    actual_result_types = [item["name"] for item in data]
    assert len(actual_result_types) == len(expected_type_names)
    assert set(actual_result_types) == expected_type_names

    # Check layers are correct
    for actual_type in data:
        actual_layers = actual_type["exposureLayers"]
        expected_layer_names = {
            layer.name for layer in exposure_layers if layer.type.name == actual_type["name"]
        }
        actual_layer_names = [layer["name"] for layer in actual_layers]
        assert set(actual_layer_names) == expected_layer_names


@pytest.mark.django_db
def test_exposure_layer_str_method(exposure_layers):
    """Test that the __str__ method returns the model's name."""
    layer = exposure_layers[0]
    expected_name = "Test layer 1"
    result_str = str(layer)

    assert result_str == expected_name
    assert result_str == layer.name
