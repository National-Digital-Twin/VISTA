# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Alter `trafficdata`.`coordinates` to be non-nullable, default to empty string."""

from typing import ClassVar

from django.db import migrations, models


class Migration(migrations.Migration):
    """Alter `trafficdata`.`coordinates` to be non-nullable, default to empty string."""

    dependencies: ClassVar = [
        ("api", "0013_metricate_envelope_restrictions"),
    ]

    operations: ClassVar = [
        migrations.AlterField(
            model_name="trafficdata",
            name="coordinates",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
    ]
