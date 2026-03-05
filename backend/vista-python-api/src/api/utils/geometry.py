# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Geometry utility functions."""

from django.contrib.gis.geos import GEOSGeometry


def buffer_geometry(connection, geometry, distance=500):
    """Buffer geometry by distance in meters using PostGIS.

    Args:
        connection: Database connection with cursor() method.
        geometry: A GEOSGeometry object to buffer.
        distance: Buffer distance in meters (default 500m).

    Returns:
        A new GEOSGeometry representing the buffered shape.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT ST_Buffer(%s::geography, %s)::geometry",
            [geometry.wkt, distance],
        )
        result = cursor.fetchone()[0]
        return GEOSGeometry(result, srid=4326)
