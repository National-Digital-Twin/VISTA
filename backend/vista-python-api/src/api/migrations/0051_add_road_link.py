# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add RoadLink model for road network routing."""

import uuid
from typing import ClassVar

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    """Migration to add RoadLink model."""

    dependencies: ClassVar = [
        ("api", "0050_group_ordering_and_uniqueness"),
    ]

    operations: ClassVar = [
        migrations.CreateModel(
            name="RoadLink",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("osid", models.CharField(db_index=True, max_length=100, unique=True)),
                ("geometry", django.contrib.gis.db.models.fields.LineStringField(srid=4326)),
                ("length_m", models.FloatField()),
                (
                    "directionality",
                    models.CharField(
                        choices=[
                            ("Both Directions", "Both Directions"),
                            ("In Direction", "In Direction"),
                            ("In Opposite Direction", "In Opposite Direction"),
                        ],
                        default="Both Directions",
                        max_length=50,
                    ),
                ),
                (
                    "road_classification",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("A Road", "A Road"),
                            ("B Road", "B Road"),
                            ("Classified Unnumbered", "Classified Unnumbered"),
                            ("Motorway", "Motorway"),
                            ("Not Classified", "Not Classified"),
                            ("Unclassified", "Unclassified"),
                            ("Unknown", "Unknown"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "route_hierarchy",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("A Road", "A Road"),
                            ("A Road Primary", "A Road Primary"),
                            ("B Road", "B Road"),
                            ("B Road Primary", "B Road Primary"),
                            ("Local Access Road", "Local Access Road"),
                            ("Local Road", "Local Road"),
                            ("Minor Road", "Minor Road"),
                            ("Motorway", "Motorway"),
                            ("Restricted Local Access Road", "Restricted Local Access Road"),
                            (
                                "Restricted Secondary Access Road",
                                "Restricted Secondary Access Road",
                            ),
                            ("Secondary Access Road", "Secondary Access Road"),
                            ("Shared Use Road", "Shared Use Road"),
                        ],
                        max_length=50,
                    ),
                ),
                ("road_number", models.CharField(blank=True, max_length=20, null=True)),
                (
                    "form_of_way",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("Canal Path", "Canal Path"),
                            ("Dual Carriageway", "Dual Carriageway"),
                            ("Enclosed Traffic Area", "Enclosed Traffic Area"),
                            ("Footbridge", "Footbridge"),
                            ("Guided Busway", "Guided Busway"),
                            ("Layby", "Layby"),
                            ("Path", "Path"),
                            ("Path With Ford", "Path With Ford"),
                            ("Path With Level Crossing", "Path With Level Crossing"),
                            ("Path With Steps", "Path With Steps"),
                            ("Roundabout", "Roundabout"),
                            ("Service Road", "Service Road"),
                            ("Shared Use Carriageway", "Shared Use Carriageway"),
                            ("Single Carriageway", "Single Carriageway"),
                            ("Slip Road", "Slip Road"),
                            ("Subway", "Subway"),
                            ("Track", "Track"),
                            ("Traffic Island Link", "Traffic Island Link"),
                            ("Traffic Island Link At Junction", "Traffic Island Link At Junction"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "operational_state",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("Addressing Only", "Addressing Only"),
                            ("Open", "Open"),
                            ("Permanently Closed", "Permanently Closed"),
                            ("Prospective", "Prospective"),
                            ("Temporarily Closed", "Temporarily Closed"),
                            ("Under Construction", "Under Construction"),
                        ],
                        max_length=50,
                    ),
                ),
                ("trunk_road", models.BooleanField(default=False)),
                ("primary_route", models.BooleanField(default=False)),
                ("start_node", models.CharField(blank=True, db_index=True, max_length=100)),
                ("end_node", models.CharField(blank=True, db_index=True, max_length=100)),
                ("speed_limit_mph", models.FloatField(blank=True, null=True)),
                ("name", models.CharField(blank=True, max_length=255)),
                ("versiondate", models.DateTimeField(blank=True, null=True)),
                ("last_updated", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddIndex(
            model_name="roadlink",
            index=models.Index(fields=["start_node", "end_node"], name="roadlink_node_idx"),
        ),
    ]
