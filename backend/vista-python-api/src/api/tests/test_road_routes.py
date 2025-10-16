"""Example test."""

from __future__ import annotations

import ast
import dataclasses
import importlib.resources
import itertools
import json
from unittest import mock

import attrs
import pytest
from cattrs.preconf.json import make_converter
from django.urls import reverse
from model_bakery import baker

from api import models

converter = make_converter()


def _fix_maxspeed(maxspeed):
    # this doesn't seem to be valid according to
    # https://wiki.openstreetmap.org/wiki/Key:maxspeed
    # but sometimes we see maxspeed="['20 mph', '30 mph']" and other times
    # we see maxspeed="['30 mph', '20 mph']", it looks a bit like a python
    # list[str] repr so that's what I'll use:
    try:
        maxspeeds = ast.literal_eval(maxspeed)
    except (SyntaxError, ValueError):
        return maxspeed

    return repr(sorted(maxspeeds))


def _maybe_sort(v):
    return sorted(v) if isinstance(v, list) else v


# no support for converter on dataclasses
# https://github.com/python/cpython/issues/94548
# so we use attrs
@attrs.frozen
class Properties:
    """Properties."""

    osmid: int | list[int]
    lanes: str | None | list[str] = attrs.field(converter=_maybe_sort)
    name: str | list[str] = attrs.field(converter=_maybe_sort)
    highway: str | list[str] = attrs.field(converter=_maybe_sort)
    maxspeed: str | None = attrs.field(converter=_fix_maxspeed)
    oneway: bool
    reversed: bool
    length: float
    ref: str | None
    speed_kph: float
    travel_time: float
    bearing: float


@dataclasses.dataclass(frozen=True)
class Geometry:
    """Geometry."""

    type: str
    coordinates: list[tuple[float, float]]


@dataclasses.dataclass(frozen=True)
class Feature:
    """Feature."""

    id: str
    type: str
    properties: Properties
    geometry: Geometry


@dataclasses.dataclass(frozen=True)
class Model:
    """Model."""

    type: str
    features: list[Feature]


def _route_roads(model: Model) -> list[str]:
    roads = (
        road_name
        for x in model.features
        for road_name in (
            [x.properties.ref]
            if x.properties.ref
            else [x.properties.name]
            if isinstance(x.properties.name, str)
            else x.properties.name
        )
    )
    # De-duplicate successive instances of the same road name
    return [road_name for road_name, _ in itertools.groupby(roads)]


def _load_graphql_geojson(data):
    return converter.loads(json.dumps(data["data"]["roadRoute"]["routeGeojson"]), Model)


def _load_resource_geojson(filename):
    return converter.loads((importlib.resources.files(__package__) / filename).read_bytes(), Model)


def test_road_route_query(client):
    """Test road route query."""
    query = """
    query getRoadRoute($floodExtent: GeoJSON){
        roadRoute(
            routeInput: {
                startLat: 50.64642343539301,
                startLon: -1.1663544011634601,
                endLat: 50.655460215519646,
                endLon: -1.1525649816610517,
                floodExtent: $floodExtent
                vehicle: null
            }
        ){
            routeGeojson
        }
    }
    """
    data = client.post(
        reverse("graphql"),
        json.dumps(
            {
                "query": query,
                "variables": {
                    "floodExtent": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [
                                [
                                    [
                                        [-1.2070763806891875, 50.66951387243779],
                                        [-1.1426854437072507, 50.65940807509449],
                                        [-1.1376182106620831, 50.65219951104493],
                                        [-1.1623364206361941, 50.65878128735582],
                                        [-1.2070763806891875, 50.66951387243779],
                                    ]
                                ]
                            ],
                        },
                    }
                },
            }
        ),
        content_type="application/json",
    ).json()
    assert data == {"data": {"roadRoute": {"routeGeojson": mock.ANY}}}
    assert _load_graphql_geojson(data) == _load_resource_geojson("road_route.json")


def test_road_route_query_blank(client):
    """Test road route query."""
    query = """
    query getRoadRoute($floodExtent: GeoJSON){
        roadRoute(
            routeInput: {
                startLat: 50.64642343539301,
                startLon: -1.1663544011634601,
                endLat: 50.655460215519646,
                endLon: -1.1525649816610517,
                floodExtent: $floodExtent
                vehicle: null
            }
        ){
            routeGeojson
        }
    }
    """
    data = client.post(
        reverse("graphql"),
        json.dumps(
            {
                "query": query,
                "variables": {"floodExtent": None},
            }
        ),
        content_type="application/json",
    ).json()
    assert data == {"data": {"roadRoute": {"routeGeojson": mock.ANY}}}
    assert _load_graphql_geojson(data) == _load_resource_geojson("road_route_no_flood.json")


def test_road_route_query_no_shortest_route(client):
    """Test road route query."""
    query = """
    query getRoadRoute($floodExtent: GeoJSON){
        roadRoute(
            routeInput: {
                startLat: 50.64642343539301,
                startLon: -1.1663544011634601,
                endLat: 50.655460215519646,
                endLon: -1.1525649816610517,
                floodExtent: $floodExtent
                vehicle: null
            }
        ){
            routeGeojson
        }
    }
    """
    assert client.post(
        reverse("graphql"),
        json.dumps(
            {
                "query": query,
                "variables": {
                    "floodExtent": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [
                                [
                                    [
                                        [-1.160134807891069, 50.65043299775209],
                                        [-1.1700882076352173, 50.64250515499123],
                                        [-1.2231325452989381, 50.67374680450513],
                                        [-1.1931509631401127, 50.66805419790256],
                                        [-1.160134807891069, 50.65043299775209],
                                    ]
                                ]
                            ],
                        },
                    }
                },
            }
        ),
        content_type="application/json",
    ).json() == {
        "data": {"roadRoute": {"routeGeojson": {"type": "FeatureCollection", "features": []}}}
    }


def test_road_route_same_start_end(client):
    """Test road route when the start and end point are identical."""
    query = """
    query getRoadRoute($floodExtent: GeoJSON){
        roadRoute(
            routeInput: {
                startLat: 50.655460215519646,
                startLon: -1.1525649816610517,
                endLat: 50.655460215519646,
                endLon: -1.1525649816610517,
                floodExtent: $floodExtent,
                vehicle: null,
            }
        ){
            routeGeojson
        }
    }
    """
    data = client.post(
        reverse("graphql"),
        json.dumps(
            {
                "query": query,
                "variables": {"floodExtent": None},
            }
        ),
        content_type="application/json",
    ).json()
    assert data == {"data": {"roadRoute": {"routeGeojson": mock.ANY}}}
    assert data["data"]["roadRoute"]["routeGeojson"] == {
        "type": "FeatureCollection",
        "features": mock.ANY,
    }


@pytest.mark.django_db
def test_road_route_query_vehicle(client):
    """Test road route query with a vehicle."""
    baker.make(
        models.NarrowRoad,
        dimension_in=98,
        width_meters=2.5,
        latitude=50.650268,
        longitude=-1.163656,
    )

    query = """
    query getRoadRoute($floodExtent: GeoJSON){
        roadRoute(
            routeInput: {
                startLat: 50.64642343539301,
                startLon: -1.1663544011634601,
                endLat: 50.655460215519646,
                endLon: -1.1525649816610517,
                floodExtent: $floodExtent
                vehicle: HGV
            }
        ){
            routeGeojson
        }
    }
    """
    data = client.post(
        reverse("graphql"),
        json.dumps(
            {
                "query": query,
                "variables": {"floodExtent": None},
            }
        ),
        content_type="application/json",
    ).json()
    assert data == {"data": {"roadRoute": {"routeGeojson": mock.ANY}}}
    assert _route_roads(_load_graphql_geojson(data)) == [
        "Araluen Way",
        "Brownlow Road",
        "A3055",
        "The Fairway",
        "Station Approach",
        "Perowne Way",
        "Station Approach",
        "Perowne Way",
        "Avenue Road",
        "B3329",
        # "Saint John's Crescent",
        # "Saint John's Road",
        # "B3329",
    ]
