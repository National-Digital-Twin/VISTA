# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Deletes the defunct sandbag placement and vulnerable people models/tables."""

from typing import ClassVar

from django.db import migrations


class Migration(migrations.Migration):
    """Deletes the defunct sandbag placement and vulnerable people models/tables."""

    dependencies: ClassVar = [
        ("api", "0014_alter_trafficdata_coordinates"),
    ]

    operations: ClassVar = [
        migrations.DeleteModel(
            name="SandbagPlacement",
        ),
        migrations.DeleteModel(
            name="VulnerablePerson",
        ),
    ]
