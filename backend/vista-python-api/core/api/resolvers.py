"""Create your resolvers here."""

import datetime
import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

from ariadne import MutationType, QueryType
from django.db import models
from django.utils.dateparse import parse_time

import api.routing as rt
from api.circle_to_polygon import Center
from api.models import LowBridge, NarrowRoad, SandbagPlacement, TrafficData, VulnerablePerson

if TYPE_CHECKING:
    from .types import GeoJSON

query = QueryType()
mutation = MutationType()


@dataclass(frozen=True)
class Vehicle:
    """A Vehicle that may experience road restrictions."""

    height_meters: float
    width_meters: float


_VEHICLES = {
    # HGV maximum width comes from the Road Vehicles (Construction and Use) Regulations 1986,
    # Part II
    # HGV maximum height comes from a report from the Health and Safety Executive
    "HGV": Vehicle(
        width_meters=2.55,
        height_meters=4.2,
    ),
    # Emergency vehicle maximum width comes from the Road Vehicles (Construction and Use)
    # Regulations 1986, Part II
    # Emergency vehicle maximum height is inferred from the same regulations
    "EmergencyVehicle": Vehicle(
        width_meters=2.75,
        height_meters=4.57,
    ),
    # Car maximum width comes from the Road Vehicles (Construction and Use) Regulations 1986,
    # Part II
    # Car maximum height is less clear but is inferred from the lowest height restriction
    # for the car class imposed by an Isle of Wight ferry operator, specifically Red Funnel.
    "Car": Vehicle(
        width_meters=2.55,
        height_meters=2,
    ),
}


def _get_points(vehicle):
    if not vehicle:
        return []

    v = _VEHICLES[vehicle]

    queries = [
        LowBridge.objects.filter(height_meters__lte=v.height_meters),
        NarrowRoad.objects.filter(width_meters__lte=v.width_meters),
    ]
    return [Center(lat=p.latitude, lon=p.longitude) for query in queries for p in query]


@query.field("roadRoute")
def resolve_road_route(*_, route_input):
    """Generate a road route from a geocodable string describing the start and end locations."""
    origin = rt.Point(X=route_input["start_lon"], Y=route_input["start_lat"])
    destination = rt.Point(X=route_input["end_lon"], Y=route_input["end_lat"])

    points = _get_points(route_input.get("vehicle"))
    G = rt.setup_graph(flood_extent=route_input.get("flood_extent"), points=points)

    route_df = rt.generate_route(G, origin, destination)

    # Convert route to GeoJSON. The version of GeoPandas we are using has no way to get the dict
    # directly, so we need to unscramble this afterwards.
    route_geojson: GeoJSON = json.loads(route_df.to_json())

    return {"route_geojson": route_geojson}


@query.field("sandbagPlacement")
def resolve_sandbag_placement(*_, name):
    """Return SandbagPlacements by name."""
    return SandbagPlacement.objects.filter(name=name)


@query.field("sandbagPlacements")
def resolve_sandbag_placements(*_):
    """Return all SandbagPlacements."""
    return SandbagPlacement.objects.all()


@dataclass(frozen=True)
class SandbagValidationError:
    """An Error related to Sandbags."""

    field: str
    messages: list[str]


@dataclass(frozen=True)
class MutateSandbagPlacementResult:
    """Result of mutating SandbagPlacement."""

    sandbag_placement: SandbagPlacement | None
    errors: list[SandbagValidationError]
    success: bool


@mutation.field("createSandbagPlacement")
def resolve_create_sandbag_placement(*_, sandbag_placement_input):
    """Create SandbagPlacements from a name, latitude and longitude."""
    return MutateSandbagPlacementResult(
        sandbag_placement=SandbagPlacement.objects.create(
            name=sandbag_placement_input["name"],
            latitude=sandbag_placement_input["latitude"],
            longitude=sandbag_placement_input["longitude"],
        ),
        errors=[],
        success=True,
    )


@mutation.field("updateSandbagPlacement")
def resolve_update_sandbag_placement(*_, sandbag_placement_input):
    """Update a named SandbagPlace to have a new latitude and longitude."""
    try:
        sandbag_placement = SandbagPlacement.objects.get(name=sandbag_placement_input["name"])
    except SandbagPlacement.DoesNotExist as e:
        return MutateSandbagPlacementResult(
            sandbag_placement=None,
            errors=[SandbagValidationError(field="name", messages=[str(e)])],
            success=False,
        )
    sandbag_placement.latitude = sandbag_placement_input["latitude"]
    sandbag_placement.longitude = sandbag_placement_input["longitude"]
    sandbag_placement.save()
    return MutateSandbagPlacementResult(
        sandbag_placement=sandbag_placement, errors=[], success=True
    )


@mutation.field("deleteSandbagPlacement")
def resolve_delete_sandbag_placement(*_, name):
    """Delete a named SandbagPlace."""
    try:
        sandbag_placement = SandbagPlacement.objects.get(name=name)
    except SandbagPlacement.DoesNotExist as e:
        return MutateSandbagPlacementResult(
            sandbag_placement=None,
            errors=[SandbagValidationError(field="name", messages=[str(e)])],
            success=False,
        )
    sandbag_placement.delete()
    return MutateSandbagPlacementResult(sandbag_placement=None, errors=[], success=True)


@query.field("roadSegment")
def resolve_road_segment(*_, road_segment_input):
    """Return traffic data given coordinates, direction at a specific day + time."""
    coordinates = road_segment_input.get("coordinates")
    direction = road_segment_input.get("direction")
    day_of_week = road_segment_input.get("day_of_week")
    time = road_segment_input.get("time")
    hour = parse_time(time)
    traffic_data = TrafficData.objects.filter(
        coordinates=coordinates, direction=direction, day_of_week=day_of_week, hour=hour
    ).first()
    if traffic_data:
        return {
            "volume": traffic_data.volume,
            "average_speed": traffic_data.average_speed,
            "coordinates": traffic_data.coordinates,
            "busyness": traffic_data.busyness,
        }
    return None


@query.field("vulnerablePeople")
def resolve_vulnerable_people(*_, vulnerable_people_input):
    """Return vulnerable people info within a given lat lon bounding box."""
    lat_min = vulnerable_people_input.get("lat_min")
    lat_max = vulnerable_people_input.get("lat_max")
    lon_min = vulnerable_people_input.get("lon_min")
    lon_max = vulnerable_people_input.get("lon_max")
    current_year = datetime.datetime.now(tz=datetime.UTC).year
    disability_conditions = [
        "Activities not limited",
        "Activities limited a little",
        "Activities limited a lot",
    ]
    return VulnerablePerson.objects.filter(
        latitude__gte=lat_min, latitude__lte=lat_max, longitude__gte=lon_min, longitude__lte=lon_max
    ).filter(
        models.Q(mock_year_of_birth__lte=current_year - 60)
        | models.Q(mock_disability__in=disability_conditions)
    )


@query.field("lowBridges")
def resolve_low_bridges(*_, low_bridge_input):
    """Return the locations of low bridges."""
    lat_min = low_bridge_input.get("lat_min")
    lat_max = low_bridge_input.get("lat_max")
    lon_min = low_bridge_input.get("lon_min")
    lon_max = low_bridge_input.get("lon_max")
    return LowBridge.objects.filter(
        latitude__gte=lat_min, latitude__lte=lat_max, longitude__gte=lon_min, longitude__lte=lon_max
    )
