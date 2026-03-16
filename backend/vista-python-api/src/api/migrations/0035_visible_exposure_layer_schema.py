# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Update VisibleExposureLayer schema to use FocusArea instead of scenario/user_id."""

from typing import ClassVar

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Update VisibleExposureLayer schema to use FocusArea instead of scenario/user_id."""

    dependencies: ClassVar = [
        ("api", "0034_visible_exposure_layer_data_migration"),
    ]

    operations: ClassVar = [
        # Remove old unique constraint that includes scenario and user_id
        migrations.RemoveConstraint(
            model_name="visibleexposurelayer",
            name="unique_visible_exposure_layer",
        ),
        # Remove scenario and user_id fields from VisibleExposureLayer
        migrations.RemoveField(
            model_name="visibleexposurelayer",
            name="scenario",
        ),
        migrations.RemoveField(
            model_name="visibleexposurelayer",
            name="user_id",
        ),
        # Make focus_area non-nullable on VisibleExposureLayer
        migrations.AlterField(
            model_name="visibleexposurelayer",
            name="focus_area",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="visible_exposure_layers",
                to="api.focusarea",
            ),
        ),
        # Add new unique constraint for VisibleExposureLayer (focus_area + exposure_layer)
        migrations.AddConstraint(
            model_name="visibleexposurelayer",
            constraint=models.UniqueConstraint(
                fields=["focus_area", "exposure_layer"],
                name="unique_visible_exposure_layer",
            ),
        ),
    ]
