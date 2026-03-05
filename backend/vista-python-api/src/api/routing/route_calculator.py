# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Route calculation with constraint integration.

This module handles routing between two points on the road network, with support for:
- Edge snapping (projecting click points onto nearest road geometry)
- Constraint-based edge blocking (road closures, floods, HGV restrictions)
- Accurate geometry trimming for mid-segment start/end points

Key Concepts
------------
**Edge Snapping**: When a user clicks mid-way along a road, the system projects the
click point onto the nearest edge geometry rather than snapping to the nearest junction.
This produces more accurate routes that don't backtrack to intersections.

**Segment Types**: Each route feature has a `segmentType` property indicating how the
geometry was processed.

- `"full"` - Complete edge traversed from start_node to end_node
- `"trimmed"` - Path edge cut to start/end at a snap point
- `"lead"` - Lead segment connecting snap point to routing node (different road)
- `"inline"` - Portion of edge when both start and end are on same edge

**Lead Segments vs Trimmed Edges**:
- Lead segments (`lead`) are added when the snap point is on a DIFFERENT road
  than what the path traverses. They connect the snap point to the junction.
- Trimmed edges (`trimmed`) are used when the first/last path edge is on the SAME
  road as the snap edge. The edge is cut to start/end at the snap point.

Example: User clicks mid-segment on road AB, routes to mid-segment on road CD
- If path is B→C→D: First edge (AB portion) is a lead-in, CD is trimmed
- If path is A→B→C→D: AB is trimmed at start, CD is trimmed at end
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from enum import StrEnum
from typing import TYPE_CHECKING

import networkx as nx
from shapely import make_valid
from shapely.geometry import LineString, Point
from shapely.ops import substring, unary_union
from shapely.prepared import prep

if TYPE_CHECKING:
    from uuid import UUID

    from networkx import DiGraph
    from shapely.geometry.base import BaseGeometry

    from .constraint_provider import ConstraintProvider
    from .graph_cache import RoutingCache

logger = logging.getLogger(__name__)

METERS_TO_MILES = 0.000621371
METERS_TO_FEET = 3.28084
MPS_TO_MPH = 2.23694

# Geometry thresholds
NEAR_ENDPOINT = 0.01  # Fraction: "essentially at endpoint"
MIN_SEGMENT_COORDS = 2  # Minimum coordinates for a valid LineString

DEFAULT_SPEED_MPS = 13.4  # 30 mph in m/s


class SegmentType(StrEnum):
    """Route segment type indicating how geometry was processed."""

    FULL = "full"
    TRIMMED = "trimmed"
    LEAD = "lead"
    INLINE = "inline"


@dataclass(frozen=True)
class RoutePoint:
    """A geographic point for routing. Uses lon/lat order to match GeoJSON convention."""

    lon: float
    lat: float


@dataclass(frozen=True)
class SnapResult:
    """Result of snapping a point to the road network.

    When edge snapping is used, the point is projected onto the nearest edge geometry.
    The node_id is the endpoint chosen for routing based on destination direction.
    """

    node_id: str
    name: str
    snapped_lon: float
    snapped_lat: float
    snap_distance_feet: float
    edge_key: tuple[str, str] | None = None
    fraction: float = 0.0


@dataclass
class RouteAccumulator:
    """Accumulates route data during path processing."""

    features: list[dict] = field(default_factory=list)
    total_meters: float = 0.0
    total_seconds: float = 0.0
    start_name: str = ""
    end_name: str = ""

    def add_feature(self, feature: dict) -> None:
        """Add feature and update totals."""
        self.features.append(feature)
        self.total_meters += feature["properties"]["distanceMiles"] / METERS_TO_MILES
        self.total_seconds += feature["properties"]["durationSeconds"]
        name = feature["properties"].get("name", "")
        if name:
            if not self.start_name:
                self.start_name = name
            self.end_name = name


class RouteCalculator:
    """Calculates routes between two geographic points on the road network.

    Uses A* pathfinding with distance weights (shortest path by distance).
    Supports edge snapping for accurate mid-segment routing, and integrates
    with constraint providers for road closures, flood zones, and vehicle restrictions.

    The calculator produces GeoJSON FeatureCollection responses with:
    - Individual features for each road segment (with osid, name, distance, duration)
    - Summary properties (total distance, duration, average speed)
    - Start/end snap information (requested vs snapped coordinates, snap distance)
    """

    def __init__(
        self,
        graph_provider: RoutingCache,
        constraint_provider: ConstraintProvider | None = None,
    ) -> None:
        """Initialize the route calculator with graph and constraint providers."""
        self._graph_provider = graph_provider
        self._constraint_provider = constraint_provider

    def calculate_route(
        self,
        start: RoutePoint,
        end: RoutePoint,
        scenario_id: UUID | None = None,
        user_id: UUID | None = None,
        vehicle: str | None = None,
    ) -> dict:
        """Calculate a route between two points, applying constraints.

        Args:
            start: Starting point (lon, lat)
            end: Ending point (lon, lat)
            scenario_id: Optional scenario ID for constraint lookup
            user_id: Optional user ID for constraint lookup
            vehicle: Optional vehicle type for restriction checks (e.g., "HGV")

        Returns:
            GeoJSON FeatureCollection with route geometry and properties.
        """
        blocked_edges: set[tuple[str, str]] = set()
        if self._constraint_provider:
            blocked_geometries = self._constraint_provider.get_blocked_geometries(
                scenario_id, user_id, vehicle
            )
            blocked_edges = self._compute_blocked_edges(blocked_geometries)

        if blocked_edges:
            G = self._graph_provider.get_graph().copy()
            edges_to_remove = [(u, v) for u, v in blocked_edges if G.has_edge(u, v)]
            G.remove_edges_from(edges_to_remove)
        else:
            G = self._graph_provider.get_graph()

        start_snap = self._find_nearest_edge(G, start.lon, start.lat)
        end_snap = self._find_nearest_edge(G, end.lon, end.lat)

        if start_snap is None or end_snap is None:
            logger.debug("Could not find nearest nodes for start or end")
            return self._empty_route()

        if start_snap.node_id == end_snap.node_id:
            return self._handle_same_node_route(G, start, end, start_snap, end_snap)

        try:
            path = nx.astar_path(
                G,
                start_snap.node_id,
                end_snap.node_id,
                heuristic=lambda u, v: self._haversine_heuristic(G, u, v),
                weight="length_m",
            )
        except nx.NetworkXNoPath:
            logger.debug("No path found between %s and %s", start_snap.node_id, end_snap.node_id)
            return self._empty_route()

        return self._path_to_geojson(G, path, start, end, start_snap, end_snap)

    def _compute_blocked_edges(
        self,
        blocked_geometries: list[BaseGeometry],
    ) -> set[tuple[str, str]]:
        """Determine which graph edges intersect with blocked geometries."""
        if not blocked_geometries:
            return set()

        edge_index, edge_keys, edge_geoms = self._graph_provider.get_edge_index()
        if edge_index is None:
            return set()

        blocked_area = make_valid(unary_union(blocked_geometries))
        prepared_area = prep(blocked_area)

        blocked: set[tuple[str, str]] = set()
        candidate_indices = edge_index.query(blocked_area)
        for idx in candidate_indices:
            if prepared_area.intersects(edge_geoms[idx]):
                u, v = edge_keys[idx]
                blocked.add((u, v))
                blocked.add((v, u))

        logger.debug("Found %d blocked edges from constraint geometries", len(blocked) // 2)
        return blocked

    def _find_nearest_edge(
        self,
        G: DiGraph,
        lon: float,
        lat: float,
    ) -> SnapResult | None:
        """Find the nearest point on any edge using spatial index.

        Projects the point onto the nearest edge geometry and returns a SnapResult
        with the closer routing node.

        Returns None if no nearby edge is found within the search radius.
        Raises RuntimeError if the edge index is not available.
        """
        edge_index, edge_keys, edge_geoms = self._graph_provider.get_edge_index()

        if edge_index is None or not edge_keys:
            raise RuntimeError("Edge spatial index not available - graph not properly loaded")

        point = Point(lon, lat)

        # Query spatial index for nearby edges (buffer in degrees, ~1km at UK latitudes)
        candidate_indices = list(edge_index.query(point.buffer(0.01)))

        if not candidate_indices:
            # Expand search if nothing found
            candidate_indices = list(edge_index.query(point.buffer(0.1)))

        if not candidate_indices:
            return None

        best_dist = float("inf")
        best_result: SnapResult | None = None

        for idx in candidate_indices:
            if idx >= len(edge_keys):
                continue

            edge_geom = edge_geoms[idx]
            u, v = edge_keys[idx]

            # Skip edges not in current graph (may have been blocked)
            if not G.has_edge(u, v):
                continue

            # Project point onto edge geometry
            projected = edge_geom.interpolate(edge_geom.project(point))
            dist_degrees = point.distance(projected)

            if dist_degrees < best_dist:
                best_dist = dist_degrees
                fraction = edge_geom.project(point, normalized=True)

                # Invert fraction if geometry direction differs from edge direction
                if self._is_geometry_inverted(G, edge_geom, u):
                    fraction = 1 - fraction

                route_node = self._choose_routing_node(u, v, fraction)

                name = G.get_edge_data(u, v, {}).get("name", "")
                dist_meters = self._haversine_distance(lon, lat, projected.x, projected.y)
                best_result = SnapResult(
                    node_id=route_node,
                    name=name,
                    snapped_lon=projected.x,
                    snapped_lat=projected.y,
                    snap_distance_feet=dist_meters * METERS_TO_FEET,
                    edge_key=(u, v),
                    fraction=fraction,
                )

        return best_result

    @staticmethod
    def _choose_routing_node(u: str, v: str, fraction: float) -> str:
        """Choose the closer endpoint of an edge to route from."""
        return u if fraction < 0.5 else v  # noqa: PLR2004

    @staticmethod
    def _linestring_length_meters(geom: LineString) -> float:
        """Calculate geodesic length of a LineString by summing haversine between vertices."""
        coords = list(geom.coords)
        total = 0.0
        for i in range(len(coords) - 1):
            total += RouteCalculator._haversine_distance(
                coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]
            )
        return total

    @staticmethod
    def _haversine_distance(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        """Calculate Haversine distance between two points in meters."""
        R = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def _haversine_heuristic(self, G: DiGraph, u: str, v: str) -> float:
        """Calculate Haversine distance heuristic for A* pathfinding."""
        u_data = G.nodes.get(u, {})
        v_data = G.nodes.get(v, {})

        u_lon = u_data.get("x")
        u_lat = u_data.get("y")
        v_lon = v_data.get("x")
        v_lat = v_data.get("y")

        if None in (u_lon, u_lat, v_lon, v_lat):
            return 0

        return self._haversine_distance(u_lon, u_lat, v_lon, v_lat)

    @staticmethod
    def _empty_route() -> dict:
        """Return an empty GeoJSON FeatureCollection for when no route exists."""
        return {
            "type": "FeatureCollection",
            "features": [],
            "properties": {
                "hasRoute": False,
            },
        }

    def _is_geometry_inverted(self, G: DiGraph, edge_geom: LineString, u: str) -> bool:
        """Check if edge geometry direction is inverted relative to edge (u, v).

        For bidirectional roads, both directions (u->v and v->u) share the same
        stored geometry. This checks if the geometry's first coordinate matches
        node u. If not, the geometry is "inverted" (starts at v instead of u).
        """
        u_data = G.nodes.get(u, {})
        u_lon, u_lat = u_data.get("x"), u_data.get("y")
        if u_lon is None or u_lat is None:
            return False

        geom_start = edge_geom.coords[0]
        return geom_start[0] != u_lon or geom_start[1] != u_lat

    def _get_edge_segment(
        self,
        G: DiGraph,
        u: str,
        v: str,
        start_frac: float = 0.0,
        end_frac: float = 1.0,
    ) -> LineString | None:
        """Extract a segment of edge geometry between two fractions.

        Fractions are in edge direction: 0.0 = at node u, 1.0 = at node v.
        Returns geometry oriented from start_frac toward end_frac.
        Handles geometry inversion internally - callers don't need to know about it.

        Args:
            G: The road network graph
            u, v: Edge endpoints (edge direction, not geometry direction)
            start_frac: Starting point as fraction along edge (0-1)
            end_frac: Ending point as fraction along edge (0-1)

        Returns:
            LineString from start_frac to end_frac, or None if geometry unavailable.
        """
        edge_data = G.get_edge_data(u, v, {})
        geom = edge_data.get("geometry")
        if not geom:
            return None

        geom_inverted = self._is_geometry_inverted(G, geom, u)

        # Convert edge fractions to geometry fractions
        if geom_inverted:
            gf_start = 1 - start_frac
            gf_end = 1 - end_frac
        else:
            gf_start = start_frac
            gf_end = end_frac

        # Ensure gf_start < gf_end for substring (it requires ordered fractions)
        needs_reverse = gf_start > gf_end
        if needs_reverse:
            gf_start, gf_end = gf_end, gf_start

        segment = substring(geom, gf_start, gf_end, normalized=True)

        if segment.is_empty or len(segment.coords) < MIN_SEGMENT_COORDS:
            return None

        # Reverse if needed to match requested direction (start_frac → end_frac)
        if needs_reverse:
            segment = LineString(segment.coords[::-1])

        return segment

    @staticmethod
    def _snap_fraction_on_edge(snap: SnapResult, edge: tuple[str, str]) -> float:
        """Get snap fraction relative to the given edge direction.

        If snap was on edge (u,v) and we want fraction on (u,v): return as-is
        If snap was on edge (v,u) and we want fraction on (u,v): return 1 - fraction
        """
        if snap.edge_key == edge:
            return snap.fraction
        if snap.edge_key == (edge[1], edge[0]):
            return 1 - snap.fraction
        raise ValueError(f"Snap edge {snap.edge_key} doesn't match {edge}")

    @staticmethod
    def _make_segment_feature(  # noqa: PLR0913
        coords: list,
        osid: str,
        name: str,
        segment_type: SegmentType,
        distance_miles: float,
        duration_seconds: float,
        speed_mph: float,
    ) -> dict:
        """Create a GeoJSON Feature dict for a route segment."""
        return {
            "type": "Feature",
            "properties": {
                "osid": osid,
                "name": name,
                "segmentType": segment_type,
                "distanceMiles": round(distance_miles, 4),
                "durationSeconds": duration_seconds,
                "speedMph": round(speed_mph, 1) if speed_mph else 0,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            },
        }

    def _junction_route(
        self,
        G: DiGraph,
        start: RoutePoint,
        end: RoutePoint,
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict:
        """Create a route when start and end snap to different edges at the same junction.

        Both points meet at the same routing node but are on different roads.
        The route consists of lead-in (snap→node) and lead-out (node→snap) segments.
        """
        acc = RouteAccumulator()

        # Create lead-in segment from start snap to junction
        lead_in = self._create_lead_segment(G, start_snap, is_start=True)
        if lead_in:
            acc.add_feature(lead_in)

        # Create lead-out segment from junction to end snap
        lead_out = self._create_lead_segment(G, end_snap, is_start=False)
        if lead_out:
            # Connect lead-out to lead-in if both exist
            if lead_in:
                lead_in_end = lead_in["geometry"]["coordinates"][-1]
                lead_out["geometry"]["coordinates"][0] = lead_in_end
            acc.add_feature(lead_out)

        if not acc.features:
            return self._empty_route()

        return self._build_route_response(acc, start, end, start_snap, end_snap)

    def _same_edge_route(
        self,
        G: DiGraph,
        start: RoutePoint,
        end: RoutePoint,
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict:
        """Create a route when start and end are on the same edge.

        Extracts the portion of the edge geometry between the two snap points.
        """
        if start_snap.edge_key is None:
            return self._empty_route()

        u, v = start_snap.edge_key
        edge_data = G.get_edge_data(u, v, {})

        # Get fractions in order (start to end along edge)
        f1, f2 = start_snap.fraction, end_snap.fraction
        if f1 > f2:
            f1, f2 = f2, f1
            start_snap, end_snap = end_snap, start_snap

        # Extract segment between the two snap points
        segment = self._get_edge_segment(G, u, v, f1, f2)
        if segment is None:
            return self._empty_route()

        segment_length_m = self._linestring_length_meters(segment)
        speed_mps = edge_data.get("speed_mps", DEFAULT_SPEED_MPS)
        travel_time_s = segment_length_m / speed_mps if speed_mps > 0 else 0

        feature = self._make_segment_feature(
            coords=list(segment.coords),
            osid=edge_data.get("osid", ""),
            name=edge_data.get("name", start_snap.name),
            segment_type=SegmentType.INLINE,
            distance_miles=segment_length_m * METERS_TO_MILES,
            duration_seconds=travel_time_s,
            speed_mph=speed_mps * MPS_TO_MPH,
        )

        acc = RouteAccumulator()
        acc.add_feature(feature)
        return self._build_route_response(acc, start, end, start_snap, end_snap)

    def _handle_same_node_route(
        self,
        G: DiGraph,
        start: RoutePoint,
        end: RoutePoint,
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict:
        """Handle routing when start and end snap to the same node.

        Three cases:
        - Same edge, different fractions: extract inline segment
        - Different edges at same junction: connect via lead segments
        - Otherwise: no valid route
        """
        # Same edge - create direct segment between snap points
        if (
            start_snap.edge_key is not None
            and start_snap.edge_key == end_snap.edge_key
            and start_snap.fraction != end_snap.fraction
        ):
            return self._same_edge_route(G, start, end, start_snap, end_snap)

        # Different edges meeting at same junction - connect via leads
        if start_snap.edge_key is not None and end_snap.edge_key is not None:
            return self._junction_route(G, start, end, start_snap, end_snap)

        logger.debug("Start and end are the same node with no valid route")
        return self._empty_route()

    def _create_lead_segment(
        self,
        G: DiGraph,
        snap: SnapResult,
        is_start: bool,
    ) -> dict | None:
        """Create a lead-in or lead-out segment connecting snap point to routing node.

        For start: creates segment from snap point TO the first path node.
        For end: creates segment from last path node TO the snap point.
        """
        if snap.edge_key is None:
            return None

        u, v = snap.edge_key
        edge_data = G.get_edge_data(u, v, {})
        fraction = snap.fraction

        # Skip if snap point is essentially at the routing node
        at_u = fraction <= NEAR_ENDPOINT
        at_v = fraction >= 1 - NEAR_ENDPOINT
        if (snap.node_id == u and at_u) or (snap.node_id == v and at_v):
            return None

        # Lead segment connects snap point to routing node:
        # - Lead-in (is_start=True): snap point → routing node (start of route)
        # - Lead-out (is_start=False): routing node → snap point (end of route)
        # Node u is at fraction 0, node v at fraction 1
        if snap.node_id == u and is_start:
            segment = self._get_edge_segment(G, u, v, fraction, 0)
        elif snap.node_id == u:
            segment = self._get_edge_segment(G, u, v, 0, fraction)
        elif is_start:
            segment = self._get_edge_segment(G, u, v, fraction, 1)
        else:
            segment = self._get_edge_segment(G, u, v, 1, fraction)

        if segment is None:
            return None

        segment_length_m = self._linestring_length_meters(segment)
        speed_mps = edge_data.get("speed_mps", DEFAULT_SPEED_MPS)
        travel_time_s = segment_length_m / speed_mps if speed_mps > 0 else 0

        return self._make_segment_feature(
            coords=list(segment.coords),
            osid=edge_data.get("osid", ""),
            name=edge_data.get("name", snap.name),
            segment_type=SegmentType.LEAD,
            distance_miles=segment_length_m * METERS_TO_MILES,
            duration_seconds=travel_time_s,
            speed_mph=speed_mps * MPS_TO_MPH,
        )

    @staticmethod
    def _is_same_road(edge1: tuple[str, str], edge2: tuple[str, str] | None) -> bool:
        """Check if two edges are on the same road (same or reverse direction)."""
        if edge2 is None:
            return False
        return edge1 == edge2 or edge1 == (edge2[1], edge2[0])

    def _trim_edge_to_snap(
        self,
        G: DiGraph,
        path_edge: tuple[str, str],
        snap: SnapResult,
        from_start: bool,
    ) -> dict | None:
        """Trim a path edge to start or end at the snap point.

        Args:
            from_start: If True, trim from path edge start to snap point.
                       If False, trim from snap point to path edge end.
        """
        if snap.edge_key is None:
            return None

        u, v = path_edge
        edge_data = G.get_edge_data(u, v, {})

        # Convert snap fraction to path_edge direction
        path_fraction = self._snap_fraction_on_edge(snap, path_edge)

        # Extract the appropriate portion
        if from_start:
            # From edge start (0) to snap point
            segment = self._get_edge_segment(G, u, v, 0, path_fraction)
            proportion = path_fraction
        else:
            # From snap point to edge end (1)
            segment = self._get_edge_segment(G, u, v, path_fraction, 1)
            proportion = 1 - path_fraction

        if segment is None:
            return None

        full_length = edge_data.get("length_m", 0)
        full_time = edge_data.get("travel_time_s", 0)
        speed_mps = edge_data.get("speed_mps", 0)

        return self._make_segment_feature(
            coords=list(segment.coords),
            osid=edge_data.get("osid", ""),
            name=edge_data.get("name", ""),
            segment_type=SegmentType.TRIMMED,
            distance_miles=full_length * proportion * METERS_TO_MILES,
            duration_seconds=full_time * proportion,
            speed_mph=speed_mps * MPS_TO_MPH,
        )

    def _path_to_geojson(  # noqa: PLR0913
        self,
        G: DiGraph,
        path: list[str],
        start: RoutePoint,
        end: RoutePoint,
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict:
        """Convert a path of node IDs to GeoJSON FeatureCollection."""
        acc = RouteAccumulator()

        first_edge = (path[0], path[1]) if len(path) >= MIN_SEGMENT_COORDS else None
        last_edge = (path[-2], path[-1]) if len(path) >= MIN_SEGMENT_COORDS else None
        trim_first = first_edge and self._is_same_road(first_edge, start_snap.edge_key)
        trim_last = last_edge and self._is_same_road(last_edge, end_snap.edge_key)

        path_features: list[dict] = []
        for i in range(len(path) - 1):
            edge = (path[i], path[i + 1])
            is_first, is_last = i == 0, i == len(path) - 2

            s_snap = start_snap if is_first and trim_first else None
            e_snap = end_snap if is_last and trim_last else None

            feature = self._process_path_edge(G, edge, s_snap, e_snap)
            if feature:
                path_features.append(feature)

        path_start_coord = None
        path_end_coord = None
        if path_features:
            path_start_coord = tuple(path_features[0]["geometry"]["coordinates"][0])
            path_end_coord = tuple(path_features[-1]["geometry"]["coordinates"][-1])

        # Add lead-in if first edge wasn't trimmed
        if not trim_first:
            lead_in = self._add_lead_segment(
                G, start_snap, is_start=True, connect_coord=path_start_coord
            )
            if lead_in:
                acc.add_feature(lead_in)

        for feature in path_features:
            acc.add_feature(feature)

        # Add lead-out if last edge wasn't trimmed
        if not trim_last:
            lead_out = self._add_lead_segment(
                G, end_snap, is_start=False, connect_coord=path_end_coord
            )
            if lead_out:
                acc.add_feature(lead_out)

        return self._build_route_response(acc, start, end, start_snap, end_snap)

    def _trim_both_ends(
        self,
        G: DiGraph,
        path_edge: tuple[str, str],
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict | None:
        """Trim an edge at both ends for start and end snap points."""
        if start_snap.edge_key is None or end_snap.edge_key is None:
            return None

        u, v = path_edge
        edge_data = G.get_edge_data(u, v, {})

        start_frac = self._snap_fraction_on_edge(start_snap, path_edge)
        end_frac = self._snap_fraction_on_edge(end_snap, path_edge)

        if start_frac > end_frac:
            start_frac, end_frac = end_frac, start_frac

        segment = self._get_edge_segment(G, u, v, start_frac, end_frac)
        if segment is None:
            return None

        full_length = edge_data.get("length_m", 0)
        full_time = edge_data.get("travel_time_s", 0)
        speed_mps = edge_data.get("speed_mps", 0)
        proportion = end_frac - start_frac

        return self._make_segment_feature(
            coords=list(segment.coords),
            osid=edge_data.get("osid", ""),
            name=edge_data.get("name", ""),
            segment_type=SegmentType.TRIMMED,
            distance_miles=full_length * proportion * METERS_TO_MILES,
            duration_seconds=full_time * proportion,
            speed_mph=speed_mps * MPS_TO_MPH,
        )

    def _process_path_edge(
        self,
        G: DiGraph,
        edge: tuple[str, str],
        start_snap: SnapResult | None,
        end_snap: SnapResult | None,
    ) -> dict | None:
        """Process a single path edge, applying trimming if needed.

        Args:
            edge: The (u, v) edge to process
            start_snap: If provided, trim from this snap point (edge start)
            end_snap: If provided, trim to this snap point (edge end)

        Returns:
            GeoJSON Feature dict, or None if no geometry
        """
        u, v = edge
        edge_data = G.get_edge_data(u, v, {})

        if start_snap and end_snap:
            return self._trim_both_ends(G, edge, start_snap, end_snap)

        if start_snap:
            return self._trim_edge_to_snap(G, edge, start_snap, from_start=False)

        if end_snap:
            return self._trim_edge_to_snap(G, edge, end_snap, from_start=True)

        # Full edge - no trimming needed
        geom = edge_data.get("geometry")
        if not geom:
            return None

        return self._make_segment_feature(
            coords=list(geom.coords),
            osid=edge_data.get("osid", ""),
            name=edge_data.get("name", ""),
            segment_type=SegmentType.FULL,
            distance_miles=edge_data.get("length_m", 0) * METERS_TO_MILES,
            duration_seconds=edge_data.get("travel_time_s", 0),
            speed_mph=edge_data.get("speed_mps", 0) * MPS_TO_MPH,
        )

    def _add_lead_segment(
        self,
        G: DiGraph,
        snap: SnapResult,
        is_start: bool,
        connect_coord: tuple[float, float] | None,
    ) -> dict | None:
        """Create lead segment and stitch coordinates if needed.

        Args:
            snap: The snap result for this endpoint
            is_start: True for lead-in, False for lead-out
            connect_coord: Coordinate to connect to (path start/end)

        Returns:
            GeoJSON Feature with coordinates stitched, or None
        """
        lead = self._create_lead_segment(G, snap, is_start=is_start)
        if not lead:
            return None

        if connect_coord:
            coords = lead["geometry"]["coordinates"]
            if is_start and coords[-1] != list(connect_coord):
                # Lead-in: stitch end of segment to path start
                coords[-1] = list(connect_coord)
            elif not is_start and coords[0] != list(connect_coord):
                # Lead-out: stitch start of segment to path end
                coords[0] = list(connect_coord)

        return lead

    def _build_route_response(
        self,
        acc: RouteAccumulator,
        start: RoutePoint,
        end: RoutePoint,
        start_snap: SnapResult,
        end_snap: SnapResult,
    ) -> dict:
        """Build the final GeoJSON FeatureCollection response."""
        distance_miles = acc.total_meters * METERS_TO_MILES
        duration_minutes = acc.total_seconds / 60
        avg_speed_mph = (
            (distance_miles / (acc.total_seconds / 3600)) if acc.total_seconds > 0 else 0
        )

        return {
            "type": "FeatureCollection",
            "features": acc.features,
            "properties": {
                "hasRoute": True,
                "distanceMiles": round(distance_miles, 2),
                "durationMinutes": round(duration_minutes, 1),
                "averageSpeedMph": round(avg_speed_mph, 1),
                "start": {
                    "name": acc.start_name or start_snap.name or "Unknown",
                    "requested": {"lat": start.lat, "lon": start.lon},
                    "snapped": {"lat": start_snap.snapped_lat, "lon": start_snap.snapped_lon},
                    "snapDistanceFeet": round(start_snap.snap_distance_feet, 1),
                },
                "end": {
                    "name": acc.end_name or end_snap.name or "Unknown",
                    "requested": {"lat": end.lat, "lon": end.lon},
                    "snapped": {"lat": end_snap.snapped_lat, "lon": end_snap.snapped_lon},
                    "snapDistanceFeet": round(end_snap.snap_distance_feet, 1),
                },
            },
        }
