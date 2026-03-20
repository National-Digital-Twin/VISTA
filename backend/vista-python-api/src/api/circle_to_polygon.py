# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""
Convert circle to polygon.

based on https://inspector.pypi.io/project/circle-to-polygon/0.1.0/packages/7f/d0/84e2c33c0b323138f26f78d607a6ba486adbbc0b7e1f5a9633ca06cfa4f4/circle_to_polygon-0.1.0-py2.py3-none-any.whl/circle_to_polygon/__init__.py

MIT License

Copyright (c) 2022 Leihb

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

from __future__ import annotations

import dataclasses
import math
from typing import Final, NewType

Meters = NewType("Meters", float)

DEFAULT_EARTH_RADIUS: Final = Meters(6378137)  # equatorial Eath radius


def _to_radians(angle_in_degrees: float) -> float:
    return (angle_in_degrees * math.pi) / 180


def _to_degrees(angle_in_radians: float) -> float:
    return (angle_in_radians * 180) / math.pi


@dataclasses.dataclass(frozen=True)
class Center:
    """The center of the circle."""

    lon: float
    lat: float


def _offset(
    c1: Center, distance: Meters, earth_radius: Meters, bearing: float
) -> tuple[float, float]:
    lat1 = _to_radians(c1.lat)
    lon1 = _to_radians(c1.lon)
    d_by_r = distance / earth_radius
    lat = math.asin(
        math.sin(lat1) * math.cos(d_by_r) + math.cos(lat1) * math.sin(d_by_r) * math.cos(bearing)
    )
    lon = lon1 + math.atan2(
        math.sin(bearing) * math.sin(d_by_r) * math.cos(lat1),
        math.cos(d_by_r) - math.sin(lat1) * math.sin(lat),
    )
    return _to_degrees(lon), _to_degrees(lat)


@dataclasses.dataclass(frozen=True)
class Options:
    """Options to prevent PLR0913."""

    n_edges: int = 32
    bearing: float = 0
    right_hand_rule: bool = False
    earth_radius: Meters = DEFAULT_EARTH_RADIUS


_OPTIONS = Options()


def circle_to_polygon(
    center: Center, radius: Meters, options: Options = _OPTIONS
) -> list[tuple[float, float]]:
    """Convert a circle to a polygon."""
    edges = options.n_edges
    earth_radius = options.earth_radius
    bearing = options.bearing
    direction = -1 if options.right_hand_rule else 1

    start = _to_radians(bearing)
    coordinates = [
        _offset(center, radius, earth_radius, start + (direction * 2 * math.pi * -i) / edges)
        for i in range(edges)
    ]
    coordinates.append(coordinates[0])
    return coordinates
