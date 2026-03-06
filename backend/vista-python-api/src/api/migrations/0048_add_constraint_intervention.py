# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add ConstraintIntervention and ConstraintInterventionType models."""

import uuid
from typing import ClassVar

import django.contrib.gis.db.models.fields
import django.db.models.deletion
from django.db import migrations, models

ROAD_BLOCKS_TYPE_ID = "cc413844-4577-4926-9478-2855785d506d"


def create_road_blocks_type(apps, schema_editor):  # noqa: ARG001
    """Create the Road blocks constraint intervention type."""
    ConstraintInterventionType = apps.get_model("api", "ConstraintInterventionType")
    ConstraintInterventionType.objects.get_or_create(
        id=ROAD_BLOCKS_TYPE_ID,
        defaults={"name": "Road blocks", "impacts_routing": True},
    )


def delete_road_blocks_type(apps, schema_editor):  # noqa: ARG001
    """Delete the Road blocks constraint intervention type."""
    ConstraintInterventionType = apps.get_model("api", "ConstraintInterventionType")
    ConstraintInterventionType.objects.filter(id=ROAD_BLOCKS_TYPE_ID).delete()


class Migration(migrations.Migration):
    """Add ConstraintIntervention and ConstraintInterventionType models."""

    dependencies: ClassVar = [
        ("api", "0048_groups"),
    ]

    operations: ClassVar = [
        migrations.CreateModel(
            name="ConstraintIntervention",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("user_id", models.UUIDField(db_index=True)),
                ("name", models.CharField(max_length=255)),
                ("geometry", django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="ConstraintInterventionType",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("impacts_routing", models.BooleanField(default=True)),
            ],
        ),
        migrations.AddField(
            model_name="constraintintervention",
            name="scenario",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="constraint_interventions",
                to="api.scenario",
            ),
        ),
        migrations.AddField(
            model_name="constraintintervention",
            name="type",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="constraint_interventions",
                to="api.constraintinterventiontype",
            ),
        ),
        migrations.RunPython(create_road_blocks_type, delete_road_blocks_type),
    ]
