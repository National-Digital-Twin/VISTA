# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""
OSMNX Utility Module for Route Generation and Written Driving Directions.

Example Usage:
```
import api.routing as rt
import osmnx as ox

ryde = rt.Point(X=-1.1633, Y=50.7300)
totland = rt.Point(X=-1.5397, Y=50.6795)

G = setup_graph()
route_df = rt.generate_route(G, origin=ryde, destination=totland)
written_navigation_guidance = compress_guidance(route_df)
```
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

import geopandas as gpd
import numpy as np
import osmnx as ox
import shapely

from api.circle_to_polygon import Center, Meters, Options, circle_to_polygon

if TYPE_CHECKING:
    from collections.abc import Sequence

    from networkx import MultiDiGraph

    from .types import GeoJSON


np.random.default_rng(0)

PLACE = "Isle of Wight, England"


def flood_graph(graph: MultiDiGraph, flood_extent: GeoJSON, points: Sequence[Center] = ()):
    """
    Flood the roads on the Isle of Wight.

    Given an OSMNX road network, and a geojson string describing a flood extent
    this returns a MultiDiGraph without the flooded nodes and edges.
    """
    if not (flood_extent or points):
        return graph
    # Returns node and edge geodataframes.
    road_nodes, road_edges = ox.graph_to_gdfs(graph)

    if flood_extent:
        # This isn't ideal, but we'll round-trip through encoded JSON to appease this version of
        # GeoPandas.
        flood_polygon: gpd.GeoDataFrame = gpd.read_file(json.dumps(flood_extent), driver="GeoJSON")

        flooded_road_nodes: gpd.GeoDataFrame = gpd.sjoin(
            road_nodes,
            flood_polygon,
            predicate="intersects",
        )
        flooded_road_edges: gpd.GeoDataFrame = gpd.sjoin(
            road_edges,
            flood_polygon,
            predicate="intersects",
        )

        # Symmetric Difference.
        road_nodes = road_nodes.loc[~road_nodes.index.isin(flooded_road_nodes.index)]
        road_edges = road_edges.loc[~road_edges.index.isin(flooded_road_edges.index)]

    if points:
        restrictions = gpd.GeoDataFrame(
            None,
            geometry=[
                shapely.Polygon(
                    shell=circle_to_polygon(point, radius=Meters(100), options=Options(5))
                )
                for point in points
            ],
            crs="EPSG:4326",
        )
        restricted_road_nodes = gpd.sjoin(road_nodes, restrictions, predicate="intersects")
        restricted_road_edges = gpd.sjoin(road_edges, restrictions, predicate="intersects")

        # Symmetric Difference.
        road_nodes = road_nodes.loc[~road_nodes.index.isin(restricted_road_nodes.index)]
        road_edges = road_edges.loc[~road_edges.index.isin(restricted_road_edges.index)]

    graph: MultiDiGraph = ox.graph_from_gdfs(gdf_nodes=road_nodes, gdf_edges=road_edges)
    return graph


def setup_graph(flood_extent: GeoJSON, points: list[Center]):
    """Instantiate Isle of Wight Graph."""
    graph: MultiDiGraph = ox.graph_from_place(PLACE, network_type="drive")

    graph = flood_graph(graph, flood_extent, points)

    graph = ox.routing.add_edge_speeds(graph)  # for shortest path by travel time.
    graph = ox.routing.add_edge_travel_times(graph)
    graph = ox.bearing.add_edge_bearings(graph)  # for text directions.

    return graph  # noqa: RET504


@dataclass(frozen=True)
class Point:
    """Simple point class."""

    X: float  # longitude in degrees East.
    Y: float  # latitude in degrees North.


def generate_route(
    graph: MultiDiGraph, origin: Point | None, destination: Point | None
) -> gpd.GeoDataFrame:
    """
    Plot route between two Points on our osmnx Graph.

    Output Dataframe has columns:
    osmid, lanes, ref, name, highway, maxspeed, oneway, reversed, length, geometry,
    speed_kph, travel_time, bearing, bridge, junction, prev_bearing, text_guidance.
    """
    origin = ox.distance.nearest_nodes(graph, X=origin.X, Y=origin.Y)
    destination = ox.distance.nearest_nodes(graph, X=destination.X, Y=destination.Y)

    if origin == destination:
        return gpd.GeoDataFrame(geometry=[])

    # Find the shortest path between nodes, minimizing travel time, then plot it
    route = ox.shortest_path(graph, origin, destination, weight="travel_time")
    if route is None:
        return gpd.GeoDataFrame(geometry=[])
    return ox.routing.route_to_gdf(graph, route)
