# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for graph cache management."""

import pytest
from django.contrib.gis.geos import LineString

from api.models.road_link import Directionality, RoadLink
from api.routing import routing_cache


@pytest.mark.django_db
class TestGraphCache:
    """Tests for graph cache singleton."""

    def test_get_graph_lazy_initializes(self):
        """Should lazy-initialize if accessed before explicit initialization."""
        # Force rebuild from empty database
        routing_cache.invalidate()

        G = routing_cache.get_graph()
        assert G is not None
        assert G.number_of_nodes() == 0  # Empty database

    def test_initialize_creates_graph(self):
        """Initialize should create a graph instance."""
        # Create some road data first
        RoadLink.objects.create(
            osid="cache-test-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="cache-a",
            end_node="cache-b",
            speed_limit_mph=30,
        )

        routing_cache.invalidate()

        G = routing_cache.get_graph()
        assert G is not None
        assert G.number_of_nodes() == 2
        assert G.number_of_edges() == 2

    def test_initialize_with_empty_database(self):
        """Initialize should work with empty database."""
        routing_cache.invalidate()

        G = routing_cache.get_graph()
        assert G is not None
        assert G.number_of_nodes() == 0
        assert G.number_of_edges() == 0

    def test_invalidate_rebuilds_graph(self):
        """Invalidate should rebuild the graph."""
        # Initialize with one road
        RoadLink.objects.create(
            osid="invalidate-test-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="inv-a",
            end_node="inv-b",
            speed_limit_mph=30,
        )

        routing_cache.invalidate()
        original_graph = routing_cache.get_graph()
        assert original_graph.number_of_nodes() == 2

        # Add another road
        RoadLink.objects.create(
            osid="invalidate-test-2",
            geometry=LineString([(-1.1, 50.1), (-1.2, 50.2)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="inv-b",
            end_node="inv-c",
            speed_limit_mph=30,
        )

        routing_cache.invalidate()
        new_graph = routing_cache.get_graph()

        # Should be a different object with more nodes
        assert new_graph is not original_graph
        assert new_graph.number_of_nodes() == 3

    def test_multiple_invalidations_safe(self):
        """Multiple invalidation calls should be safe."""
        routing_cache.invalidate()
        G1 = routing_cache.get_graph()

        routing_cache.invalidate()
        G2 = routing_cache.get_graph()

        # Should still work, graph replaced
        assert G1 is not None
        assert G2 is not None


@pytest.mark.django_db
class TestGraphCacheEdgeIndex:
    """Tests for edge index lifecycle in RoutingCache."""

    def test_get_edge_index_lazy_initializes(self):
        """Edge index should be built on first access."""
        routing_cache.invalidate()
        index, keys, geoms = routing_cache.get_edge_index()

        # With empty DB, should be (None, [], [])
        assert index is None
        assert keys == []
        assert geoms == []

    def test_edge_index_rebuilt_on_invalidate(self):
        """Invalidating cache should rebuild the edge index."""
        RoadLink.objects.create(
            osid="edge-idx-test-1",
            geometry=LineString([(-1.0, 50.0), (-1.1, 50.1)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="ei-a",
            end_node="ei-b",
            speed_limit_mph=30,
        )

        routing_cache.invalidate()
        index, keys, _geoms = routing_cache.get_edge_index()
        assert index is not None
        assert len(keys) == 2

        RoadLink.objects.create(
            osid="edge-idx-test-2",
            geometry=LineString([(-1.1, 50.1), (-1.2, 50.2)]),
            length_m=1000,
            directionality=Directionality.BOTH,
            start_node="ei-b",
            end_node="ei-c",
            speed_limit_mph=30,
        )

        routing_cache.invalidate()
        index2, keys2, _geoms2 = routing_cache.get_edge_index()
        assert index2 is not None
        assert len(keys2) == 4  # 2 roads x 2 directions
