# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Migration to create the ExposureLayer model."""

import uuid
from typing import ClassVar

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create the ExposureLayer model."""

    dependencies: ClassVar = [
        ("api", "0022_dependendency_fk_external_id"),
    ]

    operations: ClassVar = [
        migrations.CreateModel(
            name="ExposureLayer",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("geometry", django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
            ],
        ),
    ]
