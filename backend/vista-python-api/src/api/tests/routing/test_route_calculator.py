# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for route calculator with constraints."""

import uuid

import networkx as nx
import pytest
from django.contrib.gis.geos import LineString, Point, Polygon
from shapely.geometry import LineString as ShapelyLineString, box

from api.models import Asset, ExposureLayer, FocusArea, Scenario, VisibleExposureLayer
from api.models.asset_type import AssetCategory, AssetSubCategory, AssetType, DataSource
from api.models.constraint_intervention import ConstraintIntervention, ConstraintInterventionType
from api.models.exposure_layer import ExposureLayerType
from api.models.road_link import Directionality, RoadLink
from api.routing import ConstraintProvider, RouteCalculator, RoutePoint, routing_cache
from api.routing.graph_builder import build_edge_index


class MockGraphProvider:
    """Mock graph provider for unit testing."""

    def __init__(self, graph: nx.DiGraph):  # noqa: D107
        self._graph = graph
        self._edge_index, self._edge_keys, self._edge_geoms = build_edge_index(graph)

    def get_graph(self) -> nx.DiGraph:
        return self._graph

    def get_edge_index(self) -> tuple:
        return self._edge_index, self._edge_keys, self._edge_geoms


class MockConstraintProvider:
    """Mock constraint provider for unit testing."""

    def __init__(self, blocked_geometries: list | None = None):  # noqa: D107
        self._blocked_geometries = blocked_geometries or []

    def get_blocked_geometries(
        self,
        scenario_id=None,  # noqa: ARG002
        user_id=None,  # noqa: ARG002
        vehicle=None,  # noqa: ARG002
    ):
        return self._blocked_geometries


def _make_geom(coords: list) -> ShapelyLineString:
    """Create a Shapely LineString geometry for test edges."""
    return ShapelyLineString(coords)


@pytest.fixture
def simple_graph():
    """Create simple A-B-C-D test graph with geometries.

    Network layout:
        A ---- B ---- C
               |
               D
    """
    G = nx.DiGraph()
    G.add_node("A", x=-1.0, y=50.0)
    G.add_node("B", x=-1.1, y=50.0)
    G.add_node("C", x=-1.2, y=50.0)
    G.add_node("D", x=-1.1, y=49.9)

    # Define edges with geometries (LineString from u to v)
    edges = [
        ("A", "B", "ab", [(-1.0, 50.0), (-1.1, 50.0)]),
        ("B", "A", "ab", [(-1.1, 50.0), (-1.0, 50.0)]),
        ("B", "C", "bc", [(-1.1, 50.0), (-1.2, 50.0)]),
        ("C", "B", "bc", [(-1.2, 50.0), (-1.1, 50.0)]),
        ("B", "D", "bd", [(-1.1, 50.0), (-1.1, 49.9)]),
        ("D", "B", "bd", [(-1.1, 49.9), (-1.1, 50.0)]),
    ]
    for u, v, osid, coords in edges:
        G.add_edge(u, v, travel_time_s=100, length_m=1000, osid=osid, geometry=_make_geom(coords))

    return G


class TestRouteCalculatorUnit:
    """Unit tests for RouteCalculator using mocks."""

    def test_route_between_adjacent_nodes(self, simple_graph):
        """Should find route between adjacent nodes."""
        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(simple_graph),
            constraint_provider=MockConstraintProvider(),
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.1, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"

    def test_route_through_multiple_nodes(self, simple_graph):
        """Should find route through multiple nodes."""
        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(simple_graph),
            constraint_provider=MockConstraintProvider(),
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"

    def test_no_route_returns_empty(self):
        """Should return empty when no route exists between disconnected components."""
        G = nx.DiGraph()
        G.add_node("A", x=-1.0, y=50.0)
        G.add_node("B", x=-1.1, y=50.0)
        G.add_edge(
            "A",
            "B",
            travel_time_s=100,
            length_m=1000,
            osid="ab",
            geometry=_make_geom([(-1.0, 50.0), (-1.1, 50.0)]),
        )
        G.add_edge(
            "B",
            "A",
            travel_time_s=100,
            length_m=1000,
            osid="ab",
            geometry=_make_geom([(-1.1, 50.0), (-1.0, 50.0)]),
        )

        G.add_node("C", x=-1.5, y=50.5)
        G.add_node("D", x=-1.6, y=50.5)
        G.add_edge(
            "C",
            "D",
            travel_time_s=100,
            length_m=1000,
            osid="cd",
            geometry=_make_geom([(-1.5, 50.5), (-1.6, 50.5)]),
        )
        G.add_edge(
            "D",
            "C",
            travel_time_s=100,
            length_m=1000,
            osid="cd",
            geometry=_make_geom([(-1.6, 50.5), (-1.5, 50.5)]),
        )

        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(G),
            constraint_provider=MockConstraintProvider(),
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.5, lat=50.5),
        )

        assert result == {
            "type": "FeatureCollection",
            "features": [],
            "properties": {"hasRoute": False},
        }

    def test_same_origin_destination_returns_empty(self, simple_graph):
        """Should return empty when origin equals destination."""
        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(simple_graph),
            constraint_provider=MockConstraintProvider(),
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.0, lat=50.0),
        )

        assert result == {
            "type": "FeatureCollection",
            "features": [],
            "properties": {"hasRoute": False},
        }

    def test_blocked_edges_prevents_route(self, simple_graph):
        """Blocked edges from constraint provider are respected."""
        blocking_geom = box(-1.25, 49.95, -1.15, 50.05)
        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(simple_graph),
            constraint_provider=MockConstraintProvider(blocked_geometries=[blocking_geom]),
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result == {
            "type": "FeatureCollection",
            "features": [],
            "properties": {"hasRoute": False},
        }

    def test_no_constraint_provider_works(self, simple_graph):
        """Calculator should work without a constraint provider."""
        calculator = RouteCalculator(
            graph_provider=MockGraphProvider(simple_graph),
            constraint_provider=None,
        )

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"


@pytest.fixture
def simple_road_network():
    """Create a simple road network for testing.

    Network layout:
        A ---- B ---- C
               |
               D

    A at (-1.0, 50.0), B at (-1.1, 50.0), C at (-1.2, 50.0), D at (-1.1, 49.9)
    """
    RoadLink.objects.create(
        osid="ab",
        geometry=LineString([(-1.0, 50.0), (-1.1, 50.0)]),
        length_m=1000,
        directionality=Directionality.BOTH,
        start_node="A",
        end_node="B",
        speed_limit_mph=30,
    )
    RoadLink.objects.create(
        osid="bc",
        geometry=LineString([(-1.1, 50.0), (-1.2, 50.0)]),
        length_m=1000,
        directionality=Directionality.BOTH,
        start_node="B",
        end_node="C",
        speed_limit_mph=30,
    )
    RoadLink.objects.create(
        osid="bd",
        geometry=LineString([(-1.1, 50.0), (-1.1, 49.9)]),
        length_m=1000,
        directionality=Directionality.BOTH,
        start_node="B",
        end_node="D",
        speed_limit_mph=30,
    )


@pytest.fixture
def road_blocks_type():
    """Create road blocks intervention type."""
    return ConstraintInterventionType.objects.create(
        id=uuid.UUID("c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"),
        name="Road blocks",
        impacts_routing=True,
    )


@pytest.fixture
def flood_layer_type():
    """Create flood exposure layer type."""
    return ExposureLayerType.objects.create(
        id=uuid.UUID("f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"),
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


@pytest.fixture
def calculator():
    """Create a RouteCalculator backed by the real routing cache."""
    routing_cache.invalidate()
    return RouteCalculator(
        graph_provider=routing_cache,
        constraint_provider=ConstraintProvider(),
    )


@pytest.mark.django_db
class TestCalculateRouteIntegration:
    """Integration tests for RouteCalculator with real database."""

    @pytest.mark.usefixtures("simple_road_network")
    def test_route_between_adjacent_nodes(self, calculator):
        """Should find route between adjacent nodes."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.1, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 1
        assert result["features"][0]["properties"]["osid"].startswith("ab")

    @pytest.mark.usefixtures("simple_road_network")
    def test_route_through_multiple_nodes(self, calculator):
        """Should find route through multiple nodes."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)

    @pytest.mark.usefixtures("db")
    def test_no_route_raises_error_when_no_roads(self, calculator):
        """Should raise RuntimeError when no roads exist in database."""
        with pytest.raises(RuntimeError, match="Edge spatial index not available"):
            calculator.calculate_route(
                start=RoutePoint(lon=-1.0, lat=50.0),
                end=RoutePoint(lon=-1.5, lat=50.5),
            )

    @pytest.mark.usefixtures("simple_road_network")
    def test_route_includes_total_metrics(self, calculator):
        """Route should include total distance and time."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert "properties" in result
        assert "distanceMiles" in result["properties"]
        assert "durationMinutes" in result["properties"]
        actual_miles = result["properties"]["distanceMiles"]
        assert 1.0 < actual_miles < 1.5, f"Expected ~1.24 miles, got {actual_miles}"


@pytest.mark.django_db
@pytest.mark.usefixtures("simple_road_network")
class TestEdgeSnappingEdgeCases:
    """Tests for edge snapping edge cases."""

    def test_same_edge_route(self, calculator):
        """Route between two points on the same edge should work."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.03, lat=50.0),
            end=RoutePoint(lon=-1.07, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1
        assert "properties" in result
        assert result["properties"]["distanceMiles"] > 0

    def test_click_exactly_on_junction(self, calculator):
        """Route from a junction node should work."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.1, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

    def test_very_short_route_adjacent_points(self, calculator):
        """Very short route between nearby points should work."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.045, lat=50.0),
            end=RoutePoint(lon=-1.055, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

    def test_route_does_not_extend_past_end_snap_point(self, calculator):
        """Route should stop at the end snap point, not continue to the junction."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.1, lat=49.95),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        last_feature = result["features"][-1]
        last_coords = last_feature["geometry"]["coordinates"]
        last_point = last_coords[-1]
        end_lat = last_point[1]

        assert end_lat > 49.92, (
            f"Route extends past end snap point to junction. "
            f"Last coordinate lat={end_lat}, expected closer to 49.95, not 49.9 (node D)"
        )

    def test_route_with_end_closer_to_far_node(self, calculator):
        """Route should handle end point closer to the far end of an edge."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.1, lat=49.92),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        last_feature = result["features"][-1]
        last_coords = last_feature["geometry"]["coordinates"]
        last_point = last_coords[-1]
        end_lat = last_point[1]

        assert abs(end_lat - 49.92) < 0.02, (
            f"Route does not end at snap point. Last coordinate lat={end_lat}, expected ~49.92"
        )

    def test_route_with_start_closer_to_far_node(self, calculator):
        """Route should handle start point closer to the far end of an edge."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.08, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        first_feature = result["features"][0]
        first_coords = first_feature["geometry"]["coordinates"]
        first_point = first_coords[0]
        start_lon = first_point[0]

        assert abs(start_lon - (-1.08)) < 0.02, (
            f"Route does not start at snap point. First coordinate lon={start_lon}, expected ~-1.08"
        )

    def test_both_start_and_end_mid_segment(self, calculator):
        """Route with both start and end mid-segment on different roads."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.05, lat=50.0),
            end=RoutePoint(lon=-1.15, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        first_coords = result["features"][0]["geometry"]["coordinates"]
        last_coords = result["features"][-1]["geometry"]["coordinates"]

        start_lon = first_coords[0][0]
        end_lon = last_coords[-1][0]

        assert abs(start_lon - (-1.05)) < 0.02, f"Start not at snap: {start_lon}"
        assert abs(end_lon - (-1.15)) < 0.02, f"End not at snap: {end_lon}"

    def test_junction_route_different_edges(self, calculator):
        """Route where start and end are on different edges meeting at same junction."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.05, lat=50.0),
            end=RoutePoint(lon=-1.15, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        osids = [f["properties"]["osid"] for f in result["features"]]
        has_ab = any(osid == "ab" for osid in osids)
        has_bc = any(osid == "bc" for osid in osids)

        assert has_ab, f"Should have AB segment: {osids}"
        assert has_bc, f"Should have BC segment: {osids}"

        first_coords = result["features"][0]["geometry"]["coordinates"]
        last_coords = result["features"][-1]["geometry"]["coordinates"]

        assert abs(first_coords[0][0] - (-1.05)) < 0.02
        assert abs(last_coords[-1][0] - (-1.15)) < 0.02

    def test_same_edge_route_reversed(self, calculator):
        """Route on same edge where start fraction > end fraction."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.07, lat=50.0),
            end=RoutePoint(lon=-1.03, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1
        assert result["properties"]["distanceMiles"] > 0

    def test_multi_hop_route_with_lead_segments(self, calculator):
        """Multi-hop route where lead segments connect snap to path."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.05, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

        osids = [f["properties"]["osid"] for f in result["features"]]

        ab_edges = [osid for osid in osids if osid == "ab"]
        bc_edges = [osid for osid in osids if osid == "bc"]

        assert len(ab_edges) >= 1, f"Should have AB segment: {osids}"
        assert len(bc_edges) >= 1, f"Should have BC segment: {osids}"

        first_coords = result["features"][0]["geometry"]["coordinates"]
        last_coords = result["features"][-1]["geometry"]["coordinates"]

        start_lon = first_coords[0][0]
        end_lon = last_coords[-1][0]

        assert abs(start_lon - (-1.05)) < 0.02, f"Start not at snap: {start_lon}"
        assert abs(end_lon - (-1.2)) < 0.02, f"End not at C: {end_lon}"

    def test_route_geometry_continuity(self, calculator):
        """Route segments should connect without gaps."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        features = result["features"]
        assert len(features) >= 1

        for i in range(len(features) - 1):
            current_coords = features[i]["geometry"]["coordinates"]
            next_coords = features[i + 1]["geometry"]["coordinates"]

            current_end = current_coords[-1]
            next_start = next_coords[0]

            assert abs(current_end[0] - next_start[0]) < 0.0001, (
                f"Gap between segment {i} and {i + 1}: end={current_end}, start={next_start}"
            )
            assert abs(current_end[1] - next_start[1]) < 0.0001, (
                f"Gap between segment {i} and {i + 1}: end={current_end}, start={next_start}"
            )

    def test_blocked_edge_snaps_to_alternative(
        self, calculator, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """When snapped edge is blocked, should find route via alternative."""
        scenario = Scenario.objects.create(name="Test Block", is_active=False)
        create_mapwide_focus_area(scenario)
        ConstraintIntervention.objects.create(
            name="Block AB",
            geometry=Polygon(
                [
                    (-1.05, 49.95),
                    (-1.05, 50.05),
                    (-0.95, 50.05),
                    (-0.95, 49.95),
                    (-1.05, 49.95),
                ]
            ),
            is_active=True,
            scenario=scenario,
            user_id=mock_user_id,
            type=road_blocks_type,
        )
        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        assert result["type"] == "FeatureCollection"
        if result["features"]:
            osids = [f["properties"]["osid"] for f in result["features"]]
            assert not any(osid == "ab" for osid in osids)

    def test_snap_distance_is_reasonable(self, calculator):
        """Snap distance should reflect actual distance from click to road."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.05, lat=50.005),
            end=RoutePoint(lon=-1.15, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert "properties" in result
        assert "start" in result["properties"]

        snap_feet = result["properties"]["start"]["snapDistanceFeet"]
        assert 1000 < snap_feet < 3000, f"Snap distance {snap_feet}ft seems wrong for ~500m offset"

    def test_response_includes_all_required_fields(self, calculator):
        """Route response should include all required fields for frontend."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert "features" in result
        assert "properties" in result

        props = result["properties"]
        assert props["hasRoute"] is True
        assert "distanceMiles" in props
        assert "durationMinutes" in props
        assert "averageSpeedMph" in props
        assert "start" in props
        assert "end" in props

        start = props["start"]
        assert "name" in start
        assert "requested" in start
        assert "snapped" in start
        assert "snapDistanceFeet" in start
        assert "lat" in start["requested"]
        assert "lon" in start["requested"]
        assert "lat" in start["snapped"]
        assert "lon" in start["snapped"]

        assert len(result["features"]) >= 1
        feature = result["features"][0]
        assert feature["type"] == "Feature"
        assert "properties" in feature
        assert "geometry" in feature
        assert "osid" in feature["properties"]
        assert "name" in feature["properties"]
        assert "segmentType" in feature["properties"]
        assert feature["properties"]["segmentType"] in ("full", "trimmed", "lead", "inline")
        assert "distanceMiles" in feature["properties"]
        assert "durationSeconds" in feature["properties"]


@pytest.mark.django_db
class TestOneWayRoads:
    """Tests for one-way road handling."""

    @pytest.fixture
    def one_way_road_network(self):
        """Create a network with one-way roads.

        Network layout:
            A ----> B ----> C
                    ^
                    |
                    D (one-way up to B)
        """
        RoadLink.objects.create(
            osid="ab-oneway",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.0)]),
            length_m=1000,
            directionality=Directionality.IN_DIRECTION,
            start_node="A",
            end_node="B",
            speed_limit_mph=30,
        )
        RoadLink.objects.create(
            osid="bc-oneway",
            geometry=LineString([(-1.1, 50.0), (-1.2, 50.0)]),
            length_m=1000,
            directionality=Directionality.IN_DIRECTION,
            start_node="B",
            end_node="C",
            speed_limit_mph=30,
        )
        RoadLink.objects.create(
            osid="db-oneway",
            geometry=LineString([(-1.1, 49.9), (-1.1, 50.0)]),
            length_m=1000,
            directionality=Directionality.IN_DIRECTION,
            start_node="D",
            end_node="B",
            speed_limit_mph=30,
        )

    @pytest.mark.usefixtures("one_way_road_network")
    def test_route_follows_one_way_direction(self, calculator):
        """Route should follow one-way direction A→B→C."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) >= 1

    @pytest.mark.usefixtures("one_way_road_network")
    def test_no_route_against_one_way(self, calculator):
        """Cannot route against one-way direction C→B→A."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.2, lat=50.0),
            end=RoutePoint(lon=-1.0, lat=50.0),
        )

        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 0


@pytest.mark.django_db
class TestEmptyRoadNetwork:
    """Tests for empty road network handling."""

    def test_no_roads_raises_error(self, calculator):
        """Route should raise RuntimeError when no roads exist in database."""
        RoadLink.objects.all().delete()
        routing_cache.invalidate()

        with pytest.raises(RuntimeError, match="Edge spatial index not available"):
            calculator.calculate_route(
                start=RoutePoint(lon=-1.0, lat=50.0),
                end=RoutePoint(lon=-1.2, lat=50.0),
            )


@pytest.mark.django_db
@pytest.mark.usefixtures("simple_road_network")
class TestConstraintIntegration:
    """Tests for constraint intervention integration."""

    def test_polygon_constraint_blocks_route(
        self, calculator, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Route should avoid edges blocked by polygon constraint."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        create_mapwide_focus_area(scenario)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=True,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        if result["features"]:
            osids = [f["properties"]["osid"] for f in result["features"]]
            assert not any(osid == "bc" for osid in osids)

    def test_inactive_constraint_still_blocks(
        self, calculator, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Inactive (hidden) constraints should still affect routing."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        create_mapwide_focus_area(scenario)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=False,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        if result["features"]:
            osids = [f["properties"]["osid"] for f in result["features"]]
            assert not any(osid == "bc" for osid in osids)

    def test_constraint_only_affects_owner(
        self, calculator, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Constraints should only affect the user who created them."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        other_user_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
        create_mapwide_focus_area(scenario)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=other_user_id,
            scenario=scenario,
            is_active=True,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)

    def test_inactive_mapwide_skips_constraints(
        self, calculator, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Constraints should be ignored when map-wide focus area is inactive."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        create_mapwide_focus_area(scenario, is_active=False)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=True,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)


@pytest.mark.django_db
@pytest.mark.usefixtures("simple_road_network")
class TestFloodZones:
    """Tests for flood zone handling via exposure layers."""

    def test_visible_flood_layer_blocks_edges(
        self, calculator, flood_layer_type, mock_user_id, create_mapwide_focus_area
    ):
        """Visible flood layers on the map-wide focus area should block intersecting edges."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        focus_area = create_mapwide_focus_area(scenario)

        flood_layer = ExposureLayer.objects.create(
            name="Test Flood",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            geometry_buffered=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=flood_layer_type,
        )

        VisibleExposureLayer.objects.create(
            focus_area=focus_area,
            exposure_layer=flood_layer,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        if result["features"]:
            osids = [f["properties"]["osid"] for f in result["features"]]
            assert not any(osid == "bc" for osid in osids)

    def test_non_system_focus_area_flood_ignored(self, calculator, flood_layer_type, mock_user_id):
        """Flood layers in non-system focus areas should not affect routing."""
        scenario = Scenario.objects.create(name="Test", is_active=False)

        focus_area = FocusArea.objects.create(
            scenario=scenario,
            user_id=mock_user_id,
            name="User Focus Area",
            is_active=True,
            is_system=False,
        )

        flood_layer = ExposureLayer.objects.create(
            name="Test Flood",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            geometry_buffered=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=flood_layer_type,
        )

        VisibleExposureLayer.objects.create(
            focus_area=focus_area,
            exposure_layer=flood_layer,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)

    def test_non_flood_layer_type_ignored(
        self, calculator, mock_user_id, create_mapwide_focus_area
    ):
        """Non-Floods layer types should not affect routing."""
        scenario = Scenario.objects.create(name="Test", is_active=False)

        other_type = ExposureLayerType.objects.create(
            id=uuid.uuid4(),
            name="Coastal erosion",
            impacts_exposure_score=True,
        )

        focus_area = create_mapwide_focus_area(scenario)

        exposure_layer = ExposureLayer.objects.create(
            name="Test Erosion",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            geometry_buffered=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=other_type,
        )

        VisibleExposureLayer.objects.create(
            focus_area=focus_area,
            exposure_layer=exposure_layer,
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            scenario_id=scenario.id,
            user_id=mock_user_id,
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)


@pytest.mark.django_db
@pytest.mark.usefixtures("simple_road_network")
class TestLowBridgeRestrictions:
    """Tests for low bridge restrictions for HGV vehicles."""

    def test_hgv_blocked_near_low_bridge(self, calculator, low_bridge_asset_type):
        """HGV routes should avoid edges near low bridges."""
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id="low-bridge-1",
            name="Test Low Bridge",
            type=low_bridge_asset_type,
            geom=Point(-1.15, 50.0),
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            vehicle="HGV",
        )

        if result["features"]:
            osids = [f["properties"]["osid"] for f in result["features"]]
            assert not any(osid == "bc" for osid in osids)

    def test_non_hgv_ignores_low_bridge(self, calculator, low_bridge_asset_type):
        """Non-HGV vehicles should ignore low bridges."""
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id="low-bridge-2",
            name="Test Low Bridge",
            type=low_bridge_asset_type,
            geom=Point(-1.15, 50.0),
        )

        routing_cache.invalidate()

        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            vehicle="Car",
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)

    def test_no_low_bridges_returns_unchanged_route(self, calculator):
        """When no low bridges exist, HGV routing should be unchanged."""
        result = calculator.calculate_route(
            start=RoutePoint(lon=-1.0, lat=50.0),
            end=RoutePoint(lon=-1.2, lat=50.0),
            vehicle="HGV",
        )

        assert len(result["features"]) == 2
        osids = [f["properties"]["osid"] for f in result["features"]]
        assert any(osid == "ab" for osid in osids)
        assert any(osid == "bc" for osid in osids)


@pytest.mark.django_db
@pytest.mark.usefixtures("simple_road_network")
class TestConstraintProviderIntegration:
    """Integration tests for ConstraintProvider with real DB."""

    def test_constraint_intervention_returns_geometries(
        self, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Constraint interventions should return blocking geometries."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        create_mapwide_focus_area(scenario)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=True,
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(scenario.id, mock_user_id, None)

        assert len(geometries) > 0

    def test_inactive_constraint_still_returns_geometries(
        self, road_blocks_type, mock_user_id, create_mapwide_focus_area
    ):
        """Inactive (hidden) constraints should still return geometries for routing."""
        scenario = Scenario.objects.create(name="Test", is_active=False)
        create_mapwide_focus_area(scenario)

        ConstraintIntervention.objects.create(
            name="Block BC",
            geometry=Polygon(
                [
                    (-1.15, 49.95),
                    (-1.15, 50.05),
                    (-1.25, 50.05),
                    (-1.25, 49.95),
                    (-1.15, 49.95),
                ]
            ),
            type=road_blocks_type,
            user_id=mock_user_id,
            scenario=scenario,
            is_active=False,
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(scenario.id, mock_user_id, None)

        assert len(geometries) == 1

    def test_hgv_returns_bridge_geometries(self, low_bridge_asset_type):
        """HGV vehicles should return bridge blocking geometries."""
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id="low-bridge-1",
            name="Test Low Bridge",
            type=low_bridge_asset_type,
            geom=Point(-1.15, 50.0),
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(None, None, "HGV")

        assert len(geometries) > 0

    def test_non_hgv_returns_no_bridge_geometries(self, low_bridge_asset_type):
        """Non-HGV vehicles should not return bridge geometries."""
        Asset.objects.create(
            id=uuid.uuid4(),
            external_id="low-bridge-2",
            name="Test Low Bridge",
            type=low_bridge_asset_type,
            geom=Point(-1.15, 50.0),
        )

        provider = ConstraintProvider()
        geometries = provider.get_blocked_geometries(None, None, "Car")

        assert len(geometries) == 0
