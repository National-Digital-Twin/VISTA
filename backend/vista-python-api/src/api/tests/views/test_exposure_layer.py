# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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

    assert response.status_code == http_success_code

    actual_result_types = {item["name"] for item in data}
    assert expected_type_names.issubset(actual_result_types)

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


@pytest.mark.django_db
def test_exposure_layer_type_is_user_editable_field(db, client):  # noqa: ARG001
    """Test that isUserEditable field is returned in the response."""
    # Create a user-editable type
    editable_type = ExposureLayerType.objects.create(name="User drawn", is_user_editable=True)
    # Create a non-editable type
    non_editable_type = ExposureLayerType.objects.create(
        name="System Floods", is_user_editable=False
    )

    # Create layers for both types
    geom = GEOSGeometry("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))")
    ExposureLayer.objects.create(
        name="Editable Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=editable_type,
    )
    ExposureLayer.objects.create(
        name="Non-editable Layer",
        geometry=geom,
        geometry_buffered=buffer_geometry(geom),
        type=non_editable_type,
    )

    response = client.get("/api/exposurelayers/")
    data = response.json()

    assert response.status_code == http_success_code

    # Find the types in the response
    types_by_name = {t["name"]: t for t in data}

    assert "User drawn" in types_by_name
    assert "System Floods" in types_by_name

    # Verify isUserEditable field
    assert types_by_name["User drawn"]["isUserEditable"] is True
    assert types_by_name["System Floods"]["isUserEditable"] is False


@pytest.mark.django_db
def test_exposure_layer_type_default_is_not_user_editable(db):  # noqa: ARG001
    """Test that is_user_editable defaults to False."""
    layer_type = ExposureLayerType.objects.create(name="New Type")
    assert layer_type.is_user_editable is False
