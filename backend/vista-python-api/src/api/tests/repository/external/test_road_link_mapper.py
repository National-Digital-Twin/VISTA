"""Tests for mapping OS NGD Road Link data to RoadLink model."""

from datetime import UTC, datetime

import pytest

from api.models.road_link import (
    Directionality,
    FormOfWay,
    OperationalState,
    RoadClassification,
    RouteHierarchy,
)
from api.repository.external.road_link_mapper import RoadLinkMapper


@pytest.fixture
def road_link_feature():
    """Stub OS NGD Road Link feature matching real API response format."""
    return {
        "id": "92433396-4649-477a-af60-6c002d18b036",
        "type": "Feature",
        "properties": {
            "osid": "92433396-4649-477a-af60-6c002d18b036",
            "geometry_length_m": 155.495,
            "directionality": "In Direction",
            "roadclassification": "A Road",
            "routehierarchy": "A Road",
            "roadclassificationnumber": "A3055",
            "description": "Single Carriageway",
            "operationalstate": "Open",
            "trunkroad": True,
            "primaryroute": False,
            "startnode": "6e60d6a9-c94f-48e9-a14e-7c33c5bc0b41",
            "endnode": "10029f36-8a02-4d1a-9fef-6904cfa0c2f3",
            "name1_text": "Sandown Road",
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [[-1.17102, 50.6397725], [-1.1720083, 50.6385359]],
        },
    }


@pytest.fixture
def minimal_road_link_feature():
    """Stub OS NGD Road Link feature with minimal fields."""
    return {
        "id": "923ea1b8-26b6-4608-a287-254b527baab5",
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": [[-1.2031812, 50.6524468], [-1.2031555, 50.6524348]],
        },
    }


@pytest.fixture
def speed_lookup():
    """Stub speed lookup dictionary."""
    return {
        "92433396-4649-477a-af60-6c002d18b036": 40.0,
        "other-uuid-not-used": 60.0,
    }


class TestRoadLinkMapper:
    """Tests for the RoadLinkMapper."""

    @pytest.mark.django_db
    def test_map_from_os_ngd_with_all_fields(self, road_link_feature, speed_lookup):
        """Test mapping with all fields present."""
        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature, speed_lookup)

        assert road_link.osid == "92433396-4649-477a-af60-6c002d18b036"
        assert road_link.length_m == 155.495
        assert road_link.directionality == Directionality.IN_DIRECTION
        assert road_link.road_classification == RoadClassification.A_ROAD
        assert road_link.route_hierarchy == RouteHierarchy.A_ROAD
        assert road_link.road_number == "A3055"
        assert road_link.form_of_way == FormOfWay.SINGLE_CARRIAGEWAY
        assert road_link.operational_state == OperationalState.OPEN
        assert road_link.trunk_road is True
        assert road_link.primary_route is False
        assert road_link.start_node == "6e60d6a9-c94f-48e9-a14e-7c33c5bc0b41"
        assert road_link.end_node == "10029f36-8a02-4d1a-9fef-6904cfa0c2f3"
        assert road_link.name == "Sandown Road"
        assert road_link.speed_limit_mph == 40

    @pytest.mark.django_db
    def test_map_from_os_ngd_with_minimal_fields(self, minimal_road_link_feature):
        """Test mapping with only required fields."""
        road_link = RoadLinkMapper.map_from_os_ngd(minimal_road_link_feature)

        assert road_link.osid == "923ea1b8-26b6-4608-a287-254b527baab5"
        assert road_link.length_m == 0
        assert road_link.directionality == Directionality.BOTH
        assert road_link.road_classification == ""
        assert road_link.route_hierarchy == ""
        assert road_link.road_number is None
        assert road_link.form_of_way == ""
        assert road_link.operational_state == ""
        assert road_link.trunk_road is False
        assert road_link.primary_route is False
        assert road_link.start_node == ""
        assert road_link.end_node == ""
        assert road_link.name == "923ea1b8-26b6-4608-a287-254b527baab5"  # Fallback to osid
        assert road_link.speed_limit_mph is None

    @pytest.mark.django_db
    def test_map_from_os_ngd_without_speed_lookup(self, road_link_feature):
        """Test mapping without speed lookup."""
        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature, speed_lookup=None)

        assert road_link.speed_limit_mph is None

    @pytest.mark.django_db
    def test_map_from_os_ngd_speed_not_in_lookup(self, road_link_feature, speed_lookup):
        """Test mapping when osid not found in speed lookup."""
        road_link_feature["id"] = "not-in-lookup"
        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature, speed_lookup)

        assert road_link.speed_limit_mph is None

    @pytest.mark.django_db
    def test_map_from_os_ngd_geometry_converted(self, road_link_feature):
        """Test that geometry is correctly converted to GEOSGeometry."""
        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)

        assert road_link.geometry is not None
        assert road_link.geometry.geom_type == "LineString"
        coords = list(road_link.geometry.coords)
        assert len(coords) == 2
        assert coords[0] == (-1.17102, 50.6397725)
        assert coords[1] == (-1.1720083, 50.6385359)

    @pytest.mark.django_db
    def test_map_from_os_ngd_directionality_values(self, road_link_feature):
        """Test different directionality values."""
        for direction in Directionality:
            road_link_feature["properties"]["directionality"] = direction.value
            road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)
            assert road_link.directionality == direction

    @pytest.mark.django_db
    def test_map_from_os_ngd_null_fields_from_api(self, road_link_feature):
        """Test mapping when API returns explicit null values."""
        road_link_feature["properties"]["roadclassificationnumber"] = None
        road_link_feature["properties"]["name1_text"] = None

        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)

        assert road_link.road_number is None
        assert road_link.name == road_link_feature["id"]  # Fallback to osid

    @pytest.mark.django_db
    def test_map_from_os_ngd_name_fallback_to_road_number(self, road_link_feature):
        """Test name falls back to road_number when name1_text is null."""
        road_link_feature["properties"]["name1_text"] = None
        road_link_feature["properties"]["roadclassificationnumber"] = "A3055"

        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)

        assert road_link.name == "A3055"

    @pytest.mark.django_db
    def test_map_from_os_ngd_name_fallback_to_osid(self, road_link_feature):
        """Test name falls back to osid when both name1_text and road_number are null."""
        road_link_feature["properties"]["name1_text"] = None
        road_link_feature["properties"]["roadclassificationnumber"] = None

        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)

        assert road_link.name == road_link_feature["id"]

    @pytest.mark.django_db
    def test_map_from_os_ngd_captures_versiondate(self, road_link_feature):
        """Test versiondate is parsed from OS NGD properties."""
        road_link_feature["properties"]["versiondate"] = "2024-11-15T00:00:00Z"

        road_link = RoadLinkMapper.map_from_os_ngd(road_link_feature)

        assert road_link.versiondate == datetime(2024, 11, 15, tzinfo=UTC)

    @pytest.mark.django_db
    def test_map_from_os_ngd_versiondate_none_when_missing(self, minimal_road_link_feature):
        """Test versiondate is None when not present in properties."""
        road_link = RoadLinkMapper.map_from_os_ngd(minimal_road_link_feature)

        assert road_link.versiondate is None
