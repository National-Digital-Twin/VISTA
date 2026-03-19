# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add is_user_editable field to ExposureLayerType."""

from typing import ClassVar

from django.db import migrations, models

USER_DRAWN_TYPE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"


def set_user_drawn_editable(apps, schema_editor):  # noqa: ARG001
    """Set is_user_editable=True for the User drawn type."""
    ExposureLayerType = apps.get_model("api", "ExposureLayerType")
    ExposureLayerType.objects.filter(id=USER_DRAWN_TYPE_ID).update(is_user_editable=True)


def unset_user_drawn_editable(apps, schema_editor):  # noqa: ARG001
    """Revert is_user_editable for the User drawn type."""
    ExposureLayerType = apps.get_model("api", "ExposureLayerType")
    ExposureLayerType.objects.filter(id=USER_DRAWN_TYPE_ID).update(is_user_editable=False)


class Migration(migrations.Migration):
    """Add is_user_editable field to ExposureLayerType model."""

    dependencies: ClassVar = [
        ("api", "0046_focus_area_scoped_exposure"),
    ]

    operations: ClassVar = [
        migrations.AddField(
            model_name="exposurelayertype",
            name="is_user_editable",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(set_user_drawn_editable, unset_user_drawn_editable),
    ]
