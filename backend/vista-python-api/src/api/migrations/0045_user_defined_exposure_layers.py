"""Add support for user-defined exposure layers."""

from typing import ClassVar

import django.db.models.deletion
from django.db import migrations, models

USER_DRAWN_TYPE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"


def create_user_drawn_type(apps, schema_editor):  # noqa: ARG001
    """Create the User drawn exposure layer type."""
    ExposureLayerType = apps.get_model("api", "ExposureLayerType")
    ExposureLayerType.objects.get_or_create(
        id=USER_DRAWN_TYPE_ID,
        defaults={
            "name": "User drawn",
            "impacts_exposure_score": True,
        },
    )


def delete_user_drawn_type(apps, schema_editor):
    """Delete the User drawn exposure layer type and any user-defined layers."""
    ExposureLayer = apps.get_model("api", "ExposureLayer")
    ExposureLayerType = apps.get_model("api", "ExposureLayerType")
    ExposureLayer.objects.filter(user_id__isnull=False).delete()
    ExposureLayer.objects.update(scenario=None)
    schema_editor.execute("SET CONSTRAINTS ALL IMMEDIATE")
    ExposureLayerType.objects.filter(id=USER_DRAWN_TYPE_ID).delete()


class Migration(migrations.Migration):
    """Add user_id, scenario, and created_at fields for user-defined exposure layers."""

    dependencies: ClassVar = [
        ("api", "0044_realtime_exposure_scoring"),
    ]

    operations: ClassVar = [
        migrations.AddField(
            model_name="exposurelayer",
            name="user_id",
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="exposurelayer",
            name="scenario",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="user_exposure_layers",
                to="api.scenario",
            ),
        ),
        migrations.AddField(
            model_name="exposurelayer",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        # Add composite index for efficient querying of user layers
        migrations.AddIndex(
            model_name="exposurelayer",
            index=models.Index(
                fields=["user_id", "scenario"],
                name="api_exposur_user_id_scenario_idx",
            ),
        ),
        # Create the "User drawn" exposure layer type
        migrations.RunPython(create_user_drawn_type, delete_user_drawn_type),
    ]
