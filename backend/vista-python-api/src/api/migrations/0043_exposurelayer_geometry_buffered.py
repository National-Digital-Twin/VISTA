"""Add geometry_buffered field to ExposureLayer for pre-computed 500m buffer."""

from typing import ClassVar

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):
    """Add geometry_buffered column and populate with 500m buffer of existing geometries."""

    dependencies: ClassVar = [
        ("api", "0042_focusarea_created_at"),
    ]

    operations: ClassVar = [
        migrations.AddField(
            model_name="exposurelayer",
            name="geometry_buffered",
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
        migrations.RunSQL(
            sql="""
                UPDATE api_exposurelayer
                SET geometry_buffered = ST_Buffer(geometry::geography, 500)::geometry;
            """,
            reverse_sql="UPDATE api_exposurelayer SET geometry_buffered = NULL;",
        ),
        migrations.RunSQL(
            sql="""
                CREATE INDEX api_exposurelayer_geometry_buffered_idx
                ON api_exposurelayer USING GIST (geometry_buffered);
            """,
            reverse_sql="DROP INDEX IF EXISTS api_exposurelayer_geometry_buffered_idx;",
        ),
        migrations.AlterField(
            model_name="exposurelayer",
            name="geometry_buffered",
            field=django.contrib.gis.db.models.fields.GeometryField(srid=4326),
        ),
    ]
