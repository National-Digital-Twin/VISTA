# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add metric fields to low bridge and narrow road envelope data."""

from typing import ClassVar

from django.db import migrations, models

POPULATE_LOW_BRIDGE_HEIGHTS = """
UPDATE
    api_lowbridge
SET
    height_meters = dimension_in * (25.4 / 1000)
"""

POPULATE_NARROW_ROAD_WIDTHS = """
UPDATE
    api_narrowroad
SET
    width_meters = dimension_in * (25.4 / 1000)
"""


class Migration(migrations.Migration):
    """Add metric fields to low bridge and narrow road envelope data."""

    dependencies: ClassVar = [
        ("api", "0012_initial_narrow_roads"),
    ]

    operations: ClassVar = [
        migrations.AddField(
            model_name="lowbridge",
            name="height_meters",
            field=models.FloatField(null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="narrowroad",
            name="width_meters",
            field=models.FloatField(null=True),
            preserve_default=False,
        ),
        # Zero-inversion is OK because in the migration as a whole, the field
        # is immediately removed anyway in the reverse direction.
        migrations.RunSQL(POPULATE_LOW_BRIDGE_HEIGHTS, ""),
        migrations.RunSQL(POPULATE_NARROW_ROAD_WIDTHS, ""),
        migrations.AlterField(
            model_name="lowbridge",
            name="height_meters",
            field=models.FloatField(null=False),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="narrowroad",
            name="width_meters",
            field=models.FloatField(null=False),
            preserve_default=False,
        ),
    ]
