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
