# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Migrate VisibleExposureLayer data to use FocusArea."""

from typing import ClassVar

from django.db import migrations


def create_mapwide_focus_areas_for_exposure_layers(apps, _schema_editor):
    """Create map-wide FocusArea for (scenario, user_id) with NULL focus_area."""
    FocusArea = apps.get_model("api", "FocusArea")
    VisibleExposureLayer = apps.get_model("api", "VisibleExposureLayer")

    # Find all unique (scenario_id, user_id) combinations with null focus_area
    mapwide_combos = (
        VisibleExposureLayer.objects.filter(focus_area__isnull=True)
        .values("scenario_id", "user_id")
        .distinct()
    )

    for combo in mapwide_combos:
        scenario_id = combo["scenario_id"]
        user_id = combo["user_id"]

        # Check if a map-wide focus area already exists for this user/scenario
        existing_mapwide = FocusArea.objects.filter(
            scenario_id=scenario_id,
            user_id=user_id,
            is_system=True,
        ).first()

        if existing_mapwide:
            # Use existing map-wide focus area
            fa_id = existing_mapwide.id
        else:
            # Create new map-wide focus area
            fa = FocusArea.objects.create(
                scenario_id=scenario_id,
                user_id=user_id,
                name="Map-wide",
                geometry=None,
                filter_mode="by_asset_type",
                is_active=True,
                is_system=True,
            )
            fa_id = fa.id

        # Update VisibleExposureLayers to point to the map-wide FocusArea
        VisibleExposureLayer.objects.filter(
            scenario_id=scenario_id, user_id=user_id, focus_area__isnull=True
        ).update(focus_area_id=fa_id)


class Migration(migrations.Migration):
    """Migrate VisibleExposureLayer data to use FocusArea."""

    dependencies: ClassVar = [
        ("api", "0033_score_filtering_part2"),
    ]

    operations: ClassVar = [
        migrations.RunPython(
            create_mapwide_focus_areas_for_exposure_layers, migrations.RunPython.noop
        ),
    ]
