# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add score filtering to FocusArea and create AssetScoreFilter model."""
# Split into 0032/0033 to avoid PostgreSQL pending trigger events error.

import uuid
from typing import ClassVar

import django.contrib.gis.db.models.fields
import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


def create_mapwide_focus_areas(apps, _schema_editor):
    """Create map-wide FocusArea for each (scenario, user_id) with NULL focus_area VisibleAssets."""
    FocusArea = apps.get_model("api", "FocusArea")
    VisibleAsset = apps.get_model("api", "VisibleAsset")

    # Find all unique (scenario_id, user_id) combinations that have map-wide visible assets
    mapwide_combos = (
        VisibleAsset.objects.filter(focus_area__isnull=True)
        .values("scenario_id", "user_id")
        .distinct()
    )

    mapwide_focus_areas = {}
    for combo in mapwide_combos:
        fa = FocusArea.objects.create(
            scenario_id=combo["scenario_id"],
            user_id=combo["user_id"],
            name="Map-wide",
            geometry=None,
            filter_mode="by_asset_type",
            is_active=True,
            is_system=True,
        )
        mapwide_focus_areas[(combo["scenario_id"], combo["user_id"])] = fa.id

    # Update VisibleAssets to point to the new map-wide FocusArea
    for combo, fa_id in mapwide_focus_areas.items():
        VisibleAsset.objects.filter(
            scenario_id=combo[0], user_id=combo[1], focus_area__isnull=True
        ).update(focus_area_id=fa_id)


class Migration(migrations.Migration):
    """Add score filtering fields to FocusArea and create AssetScoreFilter."""

    dependencies: ClassVar = [
        ("api", "0031_update_asset_score_exposure_scenario"),
    ]

    operations: ClassVar = [
        # Add new fields to FocusArea
        migrations.AddField(
            model_name="focusarea",
            name="filter_mode",
            field=models.CharField(
                choices=[
                    ("by_asset_type", "By asset type"),
                    ("by_score_only", "By VISTA score"),
                ],
                default="by_asset_type",
                max_length=20,
            ),
        ),
        # Add is_system field for map-wide being a system-created focus area
        migrations.AddField(
            model_name="focusarea",
            name="is_system",
            field=models.BooleanField(default=False),
        ),
        # Make geometry nullable for map-wide support
        migrations.AlterField(
            model_name="focusarea",
            name="geometry",
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
        # Update FocusArea ordering
        migrations.AlterModelOptions(
            name="focusarea",
            options={"ordering": ["-is_system", "name"]},
        ),
        # Create AssetScoreFilter model
        migrations.CreateModel(
            name="AssetScoreFilter",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "criticality_values",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.IntegerField(), null=True, size=None
                    ),
                ),
                (
                    "exposure_values",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.IntegerField(), null=True, size=None
                    ),
                ),
                (
                    "redundancy_values",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.IntegerField(), null=True, size=None
                    ),
                ),
                (
                    "dependency_min",
                    models.DecimalField(decimal_places=2, max_digits=4, null=True),
                ),
                (
                    "dependency_max",
                    models.DecimalField(decimal_places=2, max_digits=4, null=True),
                ),
                (
                    "asset_type",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_filters",
                        to="api.assettype",
                    ),
                ),
                (
                    "focus_area",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="asset_score_filters",
                        to="api.focusarea",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=["focus_area", "asset_type"],
                        name="unique_asset_score_filter",
                    )
                ],
            },
        ),
        # Create map-wide FocusAreas and update VisibleAssets
        # VisibleAsset schema changes are in the next migration
        migrations.RunPython(create_mapwide_focus_areas, migrations.RunPython.noop),
    ]
