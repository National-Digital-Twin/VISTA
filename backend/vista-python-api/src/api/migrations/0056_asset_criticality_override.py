"""Add per-asset criticality override and update asset_scores view to use CTE."""

import uuid
from typing import ClassVar

import django.db.models.deletion
from django.db import migrations, models

NEW_VIEW_SQL = """\
CREATE VIEW public.asset_scores AS
WITH effective_criticality AS (
    SELECT a.id AS asset_id, a.external_id, s_a.scenario_id,
           COALESCE(aco.criticality_score, s_a.criticality_score) AS criticality_score,
           aco.id IS NOT NULL AS criticality_is_overridden
    FROM api_scenarioasset s_a
        JOIN api_asset a ON a.type_id = s_a.asset_type_id
        LEFT JOIN api_assetcriticalityoverride aco
            ON aco.asset_id = a.id AND aco.scenario_id = s_a.scenario_id
)
SELECT ec.asset_id AS id, ec.scenario_id, ec.criticality_score,
       COALESCE(avg(dep_ec.criticality_score), 0::numeric) AS dependency_score,
       3 AS redundancy_score,
       ec.criticality_is_overridden
FROM effective_criticality ec
    LEFT JOIN api_dependency a_d ON a_d.provider_asset_id = ec.external_id
    LEFT JOIN effective_criticality dep_ec
        ON dep_ec.external_id = a_d.dependent_asset_id
        AND dep_ec.scenario_id = ec.scenario_id
GROUP BY ec.asset_id, ec.scenario_id, ec.criticality_score, ec.criticality_is_overridden;
"""

OLD_VIEW_SQL = """\
CREATE VIEW public.asset_scores AS
    SELECT a.id,
        s_a.scenario_id,
        s_a.criticality_score,
        COALESCE(avg(dep_score.score), 0::numeric) AS dependency_score,
        3 AS redundancy_score
    FROM api_scenarioasset s_a
        LEFT JOIN api_asset a ON a.type_id = s_a.asset_type_id
        LEFT JOIN (
            SELECT a_d.provider_asset_id AS id,
                s_a_1.criticality_score AS score,
                s_a_1.scenario_id AS scenario_id
            FROM api_dependency a_d
                LEFT JOIN api_asset a_1 ON a_d.dependent_asset_id = a_1.external_id
                LEFT JOIN api_scenarioasset s_a_1 ON s_a_1.asset_type_id = a_1.type_id
        ) dep_score ON dep_score.id = a.external_id AND dep_score.scenario_id = s_a.scenario_id
    GROUP BY a.id, s_a.scenario_id, s_a.criticality_score;
"""


class Migration(migrations.Migration):
    """Add AssetCriticalityOverride table and update asset_scores view with CTE."""

    dependencies: ClassVar = [
        ("api", "0055_data_source_access"),
    ]

    operations: ClassVar = [
        migrations.CreateModel(
            name="AssetCriticalityOverride",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("criticality_score", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.UUIDField()),
                ("updated_by", models.UUIDField()),
                (
                    "asset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="criticality_overrides",
                        to="api.asset",
                    ),
                ),
                (
                    "scenario",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="criticality_overrides",
                        to="api.scenario",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="assetcriticalityoverride",
            constraint=models.UniqueConstraint(
                fields=("scenario", "asset"),
                name="unique_scenario_asset_criticality_override",
            ),
        ),
        migrations.AddConstraint(
            model_name="assetcriticalityoverride",
            constraint=models.CheckConstraint(
                condition=models.Q(("criticality_score__gte", 0), ("criticality_score__lte", 3)),
                name="criticality_score_range_0_3",
            ),
        ),
        migrations.RunSQL(
            sql=f"DROP VIEW IF EXISTS public.asset_scores;\n{NEW_VIEW_SQL}",
            reverse_sql=f"DROP VIEW IF EXISTS public.asset_scores;\n{OLD_VIEW_SQL}",
        ),
        migrations.AlterField(
            model_name="assetscore",
            name="id",
            field=models.OneToOneField(
                db_column="id",
                on_delete=django.db.models.deletion.DO_NOTHING,
                primary_key=True,
                related_name="asset_scores_view",
                serialize=False,
                to="api.asset",
            ),
        ),
        migrations.RenameField(
            model_name="assetscore",
            old_name="id",
            new_name="asset",
        ),
        migrations.AddField(
            model_name="assetscore",
            name="criticality_is_overridden",
            field=models.BooleanField(default=False),
            preserve_default=False,
        ),
    ]
