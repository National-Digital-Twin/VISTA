# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Thread-safe graph cache management."""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

from .graph_builder import build_edge_index, build_graph_from_database, compute_data_hash
from .refresh_scheduler import RefreshScheduler

if TYPE_CHECKING:
    from networkx import DiGraph
    from shapely import STRtree
    from shapely.geometry import LineString

logger = logging.getLogger(__name__)


class RoutingCache:
    """Thread-safe cache for the routing graph."""

    def __init__(self) -> None:
        """Initialize the routing cache."""
        self._lock = threading.RLock()
        self._graph: DiGraph | None = None
        self._edge_index: STRtree | None = None
        self._edge_keys: list[tuple[str, str]] = []
        self._edge_geometries: list[LineString] = []
        self._data_hash: str = ""
        self._scheduler: RefreshScheduler | None = None

    def get_graph(self) -> DiGraph:
        """Get the cached routing graph, initializing lazily if needed."""
        with self._lock:
            if self._graph is None:
                logger.info("Routing cache accessed before initialization, building graph...")
                self._build()
            return self._graph

    def get_edge_index(self) -> tuple[STRtree | None, list, list]:
        """Get the spatial index of edge geometries, initializing lazily if needed."""
        with self._lock:
            if self._graph is None:
                logger.info("Edge index accessed before initialization, building...")
                self._build()
            return self._edge_index, self._edge_keys, self._edge_geometries

    def initialize(self) -> None:
        """Initialize the cache and start background refresh. Call once at startup."""
        with self._lock:
            logger.info("Initializing routing cache...")
            self._build()
            self._scheduler = RefreshScheduler(
                has_changed_fn=self._has_data_changed,
                rebuild_fn=self._thread_safe_rebuild,
            )
            self._scheduler.start()

    def invalidate(self) -> None:
        """Force cache rebuild from database."""
        with self._lock:
            logger.info("Rebuilding routing cache...")
            self._build()

    def shutdown(self) -> None:
        """Stop the background refresh scheduler."""
        if self._scheduler:
            self._scheduler.stop()
            self._scheduler = None

    def _build(self) -> None:
        """Build the graph cache from database."""
        self._graph = build_graph_from_database()
        self._edge_index, self._edge_keys, self._edge_geometries = build_edge_index(self._graph)
        self._data_hash = compute_data_hash()
        logger.info(
            "Routing cache built: %d nodes, %d edges",
            self._graph.number_of_nodes(),
            self._graph.number_of_edges(),
        )

    def _has_data_changed(self) -> bool:
        return compute_data_hash() != self._data_hash

    def _thread_safe_rebuild(self) -> None:
        with self._lock:
            self._build()


routing_cache = RoutingCache()
