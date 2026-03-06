# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for graph builder."""

import pytest
from django.contrib.gis.geos import LineString

from api.models.road_link import Directionality, OperationalState, RoadLink
from api.routing.graph_builder import build_edge_index, build_graph_from_database, compute_data_hash


@pytest.mark.django_db
class TestBuildGraphFromDatabase:
    """Tests for build_graph_from_database function."""

    def test_empty_database_returns_empty_graph(self):
        """Graph should have no nodes or edges when database is empty."""
        G = build_graph_from_database()
        assert G.number_of_nodes() == 0
        assert G.number_of_edges() == 0

    def test_bidirectional_road_creates_two_edges(self):
        """Both Directions should create edges in both directions."""
        RoadLink.objects.create(
            osid="test-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-a",
            end_node="node-b",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        assert G.has_edge("node-a", "node-b")
        assert G.has_edge("node-b", "node-a")
        assert G.number_of_edges() == 2

    def test_in_direction_creates_single_edge(self):
        """In Direction should create edge from start to end only."""
        RoadLink.objects.create(
            osid="test-2",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.IN_DIRECTION,
            start_node="node-c",
            end_node="node-d",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        assert G.has_edge("node-c", "node-d")
        assert not G.has_edge("node-d", "node-c")
        assert G.number_of_edges() == 1

    def test_opposite_direction_creates_reverse_edge(self):
        """In Opposite Direction should create edge from end to start only."""
        RoadLink.objects.create(
            osid="test-3",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.IN_OPPOSITE,
            start_node="node-e",
            end_node="node-f",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        assert not G.has_edge("node-e", "node-f")
        assert G.has_edge("node-f", "node-e")
        assert G.number_of_edges() == 1

    def test_edge_attributes_include_travel_time(self):
        """Edge should have travel_time_s calculated from length and speed."""
        RoadLink.objects.create(
            osid="test-4",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,  # 1km
            directionality=Directionality.BOTH,
            start_node="node-g",
            end_node="node-h",
            speed_limit_mph=60,  # ~26.8 m/s
        )

        G = build_graph_from_database()
        edge_data = G.get_edge_data("node-g", "node-h")

        assert "travel_time_s" in edge_data
        # 1000m / (60 * 0.44704) m/s ≈ 37.3 seconds
        assert 35 < edge_data["travel_time_s"] < 40

    def test_node_coordinates_stored(self):
        """Nodes should have x (lon) and y (lat) coordinates."""
        RoadLink.objects.create(
            osid="test-5",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-i",
            end_node="node-j",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()

        node_i_data = G.nodes["node-i"]
        assert node_i_data["x"] == -1
        assert node_i_data["y"] == 50

        node_j_data = G.nodes["node-j"]
        assert node_j_data["x"] == pytest.approx(-1.1)
        assert node_j_data["y"] == pytest.approx(50.1)

    def test_skips_links_without_nodes(self):
        """Links without start_node or end_node should be skipped."""
        RoadLink.objects.create(
            osid="test-6",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="",  # Empty start node
            end_node="node-k",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        assert G.number_of_nodes() == 0
        assert G.number_of_edges() == 0

    def test_skips_non_operational_roads(self):
        """Roads that are not open should be excluded from graph."""
        # Create an open road - should be included
        RoadLink.objects.create(
            osid="open-road",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-open-a",
            end_node="node-open-b",
            speed_limit_mph=30,
            operational_state=OperationalState.OPEN,
        )

        # Create a closed road - should be excluded
        RoadLink.objects.create(
            osid="closed-road",
            geometry=LineString([(-1.2, 50.0), (-1.3, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-closed-a",
            end_node="node-closed-b",
            speed_limit_mph=30,
            operational_state=OperationalState.PERMANENTLY_CLOSED,
        )

        # Create an under-construction road - should be excluded
        RoadLink.objects.create(
            osid="construction-road",
            geometry=LineString([(-1.4, 50.0), (-1.5, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-construction-a",
            end_node="node-construction-b",
            speed_limit_mph=30,
            operational_state=OperationalState.UNDER_CONSTRUCTION,
        )

        G = build_graph_from_database()

        # Only the open road should be in the graph
        assert G.has_edge("node-open-a", "node-open-b")
        assert not G.has_node("node-closed-a")
        assert not G.has_node("node-construction-a")
        assert G.number_of_nodes() == 2  # Only the open road's nodes

    def test_includes_roads_with_empty_operational_state(self):
        """Roads with empty operational_state should be included (legacy data)."""
        RoadLink.objects.create(
            osid="legacy-road",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-legacy-a",
            end_node="node-legacy-b",
            speed_limit_mph=30,
            operational_state="",  # Empty - legacy data
        )

        G = build_graph_from_database()
        assert G.has_edge("node-legacy-a", "node-legacy-b")


@pytest.mark.django_db
class TestComputeDataHash:
    """Tests for compute_data_hash function."""

    def test_empty_database_returns_hash(self):
        """Should return a hash even with empty database."""
        hash_value = compute_data_hash()
        assert isinstance(hash_value, str)
        assert len(hash_value) == 32  # MD5 hash length

    def test_hash_changes_with_new_data(self):
        """Hash should change when data is added."""
        hash_before = compute_data_hash()

        RoadLink.objects.create(
            osid="test-hash-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="node-x",
            end_node="node-y",
            speed_limit_mph=30,
        )

        hash_after = compute_data_hash()
        assert hash_before != hash_after


@pytest.mark.django_db
class TestBuildEdgeIndex:
    """Tests for build_edge_index function."""

    def test_empty_graph_returns_none_index(self):
        """Empty graph should return (None, [], [])."""
        G = build_graph_from_database()
        index, keys, geoms = build_edge_index(G)

        assert index is None
        assert keys == []
        assert geoms == []

    def test_creates_strtree_with_correct_count(self):
        """Non-empty graph should return an STRtree with correct geometry count."""
        RoadLink.objects.create(
            osid="idx-test-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="idx-a",
            end_node="idx-b",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        index, keys, geoms = build_edge_index(G)

        assert index is not None
        assert len(keys) == 2  # Both directions
        assert len(geoms) == 2

    def test_returns_correct_keys_and_geoms(self):
        """Edge keys and geometries should correspond to graph edges."""
        RoadLink.objects.create(
            osid="idx-test-2",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.IN_DIRECTION,
            start_node="idx-c",
            end_node="idx-d",
            speed_limit_mph=30,
        )

        G = build_graph_from_database()
        _index, keys, geoms = build_edge_index(G)

        assert len(keys) == 1
        assert keys[0] == ("idx-c", "idx-d")
        assert geoms[0].geom_type == "LineString"
