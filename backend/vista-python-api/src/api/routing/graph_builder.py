# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Build NetworkX routing graph from RoadLink database."""

from __future__ import annotations

import hashlib
import logging
from typing import TYPE_CHECKING

import networkx as nx
from django.db.models import Count, Max
from shapely import STRtree
from shapely.geometry import LineString

from api.models.road_link import Directionality, OperationalState, RoadLink

if TYPE_CHECKING:
    from networkx import DiGraph

logger = logging.getLogger(__name__)

MPH_TO_MPS = 0.44704  # miles per hour to meters per second


def build_graph_from_database() -> DiGraph:
    """Build a NetworkX DiGraph from RoadLink records.

    Returns:
        NetworkX DiGraph with road network topology.
        Nodes are identified by OS NGD node IDs (start_node/end_node).
        Edges have attributes: osid, geometry, length_m, speed_mps, travel_time_s
    """
    G = nx.DiGraph()

    road_links = RoadLink.objects.all().only(
        "osid",
        "geometry",
        "length_m",
        "directionality",
        "start_node",
        "end_node",
        "speed_limit_mph",
        "road_classification",
        "operational_state",
        "name",
    )

    for link in road_links:
        if not link.start_node or not link.end_node:
            continue

        if link.operational_state and link.operational_state != OperationalState.OPEN:
            continue

        coords = link.geometry.coords
        start_coords = coords[0]  # (lon, lat)
        end_coords = coords[-1]

        if link.start_node not in G:
            G.add_node(link.start_node, x=start_coords[0], y=start_coords[1])
        if link.end_node not in G:
            G.add_node(link.end_node, x=end_coords[0], y=end_coords[1])

        speed_mph = link.get_speed()
        speed_mps = speed_mph * MPH_TO_MPS
        travel_time_s = link.length_m / speed_mps if speed_mps > 0 else float("inf")

        edge_attrs = {
            "osid": link.osid,
            "geometry": LineString(link.geometry.coords),
            "length_m": link.length_m,
            "speed_mps": speed_mps,
            "travel_time_s": travel_time_s,
            "name": link.name or "",
        }

        if link.directionality == Directionality.BOTH:
            G.add_edge(link.start_node, link.end_node, **edge_attrs)
            G.add_edge(link.end_node, link.start_node, **edge_attrs)
        elif link.directionality == Directionality.IN_DIRECTION:
            G.add_edge(link.start_node, link.end_node, **edge_attrs)
        elif link.directionality == Directionality.IN_OPPOSITE:
            G.add_edge(link.end_node, link.start_node, **edge_attrs)

    logger.info("Built graph with %d nodes and %d edges", G.number_of_nodes(), G.number_of_edges())
    return G


def compute_data_hash() -> str:
    """Compute hash of RoadLink data for change detection.

    Returns:
        MD5 hash string based on record count and latest update timestamp.
    """
    agg = RoadLink.objects.aggregate(count=Count("id"), latest=Max("last_updated"))
    count = agg["count"]
    latest = agg["latest"]
    latest_ts = latest.isoformat() if latest else ""

    hash_input = f"{count}:{latest_ts}"
    return hashlib.md5(hash_input.encode(), usedforsecurity=False).hexdigest()


def build_edge_index(G: DiGraph) -> tuple[STRtree | None, list, list]:
    """Build spatial index of edge geometries for fast intersection queries.

    Args:
        G: NetworkX graph with edge geometries

    Returns:
        Tuple of (STRtree, edge_keys, edge_geometries) or (None, [], []) if no edges.
    """
    edge_geoms = []
    edge_keys = []

    for u, v, data in G.edges(data=True):
        geom = data.get("geometry")
        if geom:
            edge_geoms.append(geom)
            edge_keys.append((u, v))

    if not edge_geoms:
        return None, [], []

    logger.info("Built edge spatial index with %d geometries", len(edge_geoms))
    return STRtree(edge_geoms), edge_keys, edge_geoms
