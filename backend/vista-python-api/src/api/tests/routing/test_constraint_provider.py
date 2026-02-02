"""Tests for the constraint provider."""

import uuid

import pytest
from django.contrib.gis.geos import LineString, Point, Polygon

from api.models import Asset, ExposureLayer, FocusArea, Scenario, VisibleExposureLayer
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.constraint_intervention import ConstraintIntervention, ConstraintInterventionType
from api.models.exposure_layer import ExposureLayerType
from api.routing import ConstraintProvider


@pytest.fixture
def road_blocks_type():
    """Create road blocks intervention type."""
    return ConstraintInterventionType.objects.create(
        id=uuid.uuid4(),
        name="Road blocks",
        impacts_routing=True,
    )


@pytest.fixture
def flood_layer_type():
    """Create flood exposure layer type."""
    return ExposureLayerType.objects.create(
        id=uuid.uuid4(),
        name="Floods",
        impacts_exposure_score=True,
    )


@pytest.fixture
def low_bridge_asset_type():
    """Create low bridge asset type."""
    category = AssetCategory.objects.create(id=uuid.uuid4(), name="Transport")
    sub_category = AssetSubCategory.objects.create(
        id=uuid.uuid4(), name="Road infrastructure", category=category
    )
    data_source = DataSource.objects.create(
        id=uuid.uuid4(), name="Test Source", owner="Test", description_md="Test"
    )
    return AssetType.objects.create(
        id=uuid.uuid4(),
        name="Low bridge",
        sub_category=sub_category,
        data_source=data_source,
    )


@pytest.mark.django_db
class TestConstraintProviderUnit:
    """Direct unit tests for ConstraintProvider."""

    def test_returns_empty_without_scenario_or_user(self):
        """Should return empty list when scenario_id and user_id are None."""
        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(None, None, None)
        assert geometries == []

    def test_returns_bridge_geometries_with_only_vehicle(self, low_bridge_asset_type):
        """Should return bridge geometries when only vehicle is provided."""
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id="low-bridge-test",
            name="Test Low Bridge",
            type=low_bridge_asset_type,
            geom=Point(-1.15, 50.0),
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(None, None, "HGV")

        assert len(geometries) == 1

    def test_line_string_constraint_is_buffered(self, road_blocks_type, mock_user_id):
        """LineString constraints should be buffered into polygons."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        ConstraintIntervention.objects.create(
            name="Road closure",
            geometry=LineString([(-1.1, 50.0), (-1.2, 50.0)]),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=True,
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(scenario.id, mock_user_id, None)

        assert len(geometries) == 1
        geom = geometries[0]
        assert geom.geom_type == "Polygon", (
            f"LineString should be buffered to Polygon, got {geom.geom_type}"
        )

    def test_polygon_constraint_not_buffered(self, road_blocks_type, mock_user_id):
        """Polygon constraints should be returned without additional buffering."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        original_polygon = Polygon(
            [
                (-1.15, 49.95),
                (-1.15, 50.05),
                (-1.25, 50.05),
                (-1.25, 49.95),
                (-1.15, 49.95),
            ]
        )

        ConstraintIntervention.objects.create(
            name="Blocked area",
            geometry=original_polygon,
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=True,
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(scenario.id, mock_user_id, None)

        assert len(geometries) == 1
        geom = geometries[0]
        assert geom.geom_type == "Polygon"
        # Area should be approximately the same (not buffered)
        assert abs(geom.area - original_polygon.area) < original_polygon.area * 0.01

    def test_flood_geometry_from_multiple_focus_areas(self, flood_layer_type, mock_user_id):
        """Flood geometries from multiple active focus areas should all be returned."""
        scenario = Scenario.objects.create(name="Test", is_active=False)

        flood_polygon = Polygon(
            [
                (-1.15, 49.95),
                (-1.15, 50.05),
                (-1.25, 50.05),
                (-1.25, 49.95),
                (-1.15, 49.95),
            ]
        )

        flood_layer_1 = ExposureLayer.objects.create(
            name="Flood 1",
            geometry=flood_polygon,
            geometry_buffered=flood_polygon,
            type=flood_layer_type,
        )
        flood_layer_2 = ExposureLayer.objects.create(
            name="Flood 2",
            geometry=flood_polygon,
            geometry_buffered=flood_polygon,
            type=flood_layer_type,
        )

        focus_area_1 = FocusArea.objects.create(
            scenario=scenario, user_id=mock_user_id, name="FA 1", is_active=True
        )
        focus_area_2 = FocusArea.objects.create(
            scenario=scenario, user_id=mock_user_id, name="FA 2", is_active=True
        )

        VisibleExposureLayer.objects.create(focus_area=focus_area_1, exposure_layer=flood_layer_1)
        VisibleExposureLayer.objects.create(focus_area=focus_area_2, exposure_layer=flood_layer_2)

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(scenario.id, mock_user_id, None)

        assert len(geometries) == 2
