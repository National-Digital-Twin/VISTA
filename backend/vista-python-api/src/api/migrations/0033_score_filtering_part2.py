# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Update VisibleAsset schema to use FocusArea instead of scenario/user_id."""

from typing import ClassVar

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Update VisibleAsset schema to use FocusArea instead of scenario/user_id."""

    dependencies: ClassVar = [
        ("api", "0032_score_filtering"),
    ]

    operations: ClassVar = [
        # Remove old unique constraint that includes scenario and user_id
        migrations.RemoveConstraint(
            model_name="visibleasset",
            name="unique_visible_asset",
        ),
        # Remove scenario and user_id fields from VisibleAsset
        migrations.RemoveField(
            model_name="visibleasset",
            name="scenario",
        ),
        migrations.RemoveField(
            model_name="visibleasset",
            name="user_id",
        ),
        # Make focus_area non-nullable on VisibleAsset
        migrations.AlterField(
            model_name="visibleasset",
            name="focus_area",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="visible_assets",
                to="api.focusarea",
            ),
        ),
        # Add new unique constraint for VisibleAsset (focus_area + asset_type)
        migrations.AddConstraint(
            model_name="visibleasset",
            constraint=models.UniqueConstraint(
                fields=["focus_area", "asset_type"],
                name="unique_visible_asset",
            ),
        ),
    ]
