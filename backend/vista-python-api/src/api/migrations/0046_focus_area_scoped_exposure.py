# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Add focus_area_id to exposure score calculation and simplify asset_scores view."""
# ruff: noqa: E501

from typing import ClassVar

from django.db import migrations


class Migration(migrations.Migration):
    """Update views to scope exposure scores by focus area."""

    dependencies: ClassVar = [
        ("api", "0045_user_defined_exposure_layers"),
    ]

    operations: ClassVar = [
        migrations.RunSQL(
            sql="""
                -- Drop existing views (asset_scores depends on visible_exposure_asset_scores)
                DROP VIEW IF EXISTS public.asset_scores CASCADE;
                DROP VIEW IF EXISTS public.visible_exposure_asset_scores CASCADE;

                -- Recreate visible_exposure_asset_scores WITH focus_area_id
                -- This allows exposure scores to be calculated per focus area
                CREATE VIEW public.visible_exposure_asset_scores AS
                    WITH active_exposure_layers AS (
                        SELECT ael.asset_id,
                            fa.user_id,
                            fa.scenario_id,
                            fa.id AS focus_area_id,
                            ael.exposure_layer_id,
                            ael.intersects
                        FROM assets_within_500m_exposure_layers ael
                            JOIN api_visibleexposurelayer ve ON ael.exposure_layer_id = ve.exposure_layer_id
                            JOIN api_focusarea fa ON ve.focus_area_id = fa.id
                    ), agg AS (
                        SELECT active_exposure_layers.asset_id,
                            active_exposure_layers.user_id,
                            active_exposure_layers.scenario_id,
                            active_exposure_layers.focus_area_id,
                            count(*) FILTER (WHERE active_exposure_layers.intersects) AS inter_ct,
                            count(*) FILTER (WHERE NOT active_exposure_layers.intersects) AS near_ct
                        FROM active_exposure_layers
                        GROUP BY active_exposure_layers.asset_id, active_exposure_layers.user_id,
                                 active_exposure_layers.scenario_id, active_exposure_layers.focus_area_id
                    )
                    SELECT asset_id,
                        user_id,
                        scenario_id,
                        focus_area_id,
                        CASE
                            WHEN inter_ct > 1 THEN 3
                            WHEN inter_ct = 1 THEN 2
                            WHEN near_ct >= 1 THEN 1
                            ELSE 0
                        END AS score
                    FROM agg;

                -- Simplified asset_scores view without exposure_score
                -- Exposure score is now queried separately via visible_exposure_asset_scores with focus_area_id
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
            """,
            reverse_sql="""
                -- Restore original views from migration 0044
                DROP VIEW IF EXISTS public.asset_scores CASCADE;
                DROP VIEW IF EXISTS public.visible_exposure_asset_scores CASCADE;

                -- Recreate visible_exposure_asset_scores WITHOUT focus_area_id (original)
                CREATE VIEW public.visible_exposure_asset_scores AS
                    WITH active_exposure_layers AS (
                        SELECT ael.asset_id,
                            fa.user_id,
                            fa.scenario_id,
                            ael.exposure_layer_id,
                            ael.intersects
                        FROM assets_within_500m_exposure_layers ael
                            JOIN api_visibleexposurelayer ve ON ael.exposure_layer_id = ve.exposure_layer_id
                            JOIN api_focusarea fa ON ve.focus_area_id = fa.id
                    ), agg AS (
                        SELECT active_exposure_layers.asset_id,
                            active_exposure_layers.user_id,
                            active_exposure_layers.scenario_id,
                            count(*) FILTER (WHERE active_exposure_layers.intersects) AS inter_ct,
                            count(*) FILTER (WHERE NOT active_exposure_layers.intersects) AS near_ct
                        FROM active_exposure_layers
                        GROUP BY active_exposure_layers.asset_id, active_exposure_layers.user_id,
                                 active_exposure_layers.scenario_id
                    )
                    SELECT asset_id,
                        user_id,
                        scenario_id,
                        CASE
                            WHEN inter_ct > 1 THEN 3
                            WHEN inter_ct = 1 THEN 2
                            WHEN near_ct >= 1 THEN 1
                            ELSE 0
                        END AS score
                    FROM agg;

                -- Recreate asset_scores WITH exposure_score (original)
                CREATE VIEW public.asset_scores AS
                    SELECT a.id,
                        s_a.scenario_id,
                        exposure.user_id,
                        s_a.criticality_score,
                        COALESCE(avg(dep_score.score), 0::numeric) AS dependency_score,
                        COALESCE(exposure.score, 0) AS exposure_score,
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
                        LEFT JOIN (
                            SELECT veas.asset_id,
                                veas.user_id,
                                veas.scenario_id,
                                veas.score
                            FROM visible_exposure_asset_scores veas
                            UNION ALL
                            SELECT veas.asset_id,
                                NULL::uuid AS user_id,
                                veas.scenario_id,
                                0 AS score
                            FROM visible_exposure_asset_scores veas
                        ) exposure ON exposure.asset_id = a.id AND exposure.scenario_id = s_a.scenario_id
                    GROUP BY a.id, s_a.scenario_id, exposure.user_id, s_a.criticality_score, exposure.score;
            """,
        ),
    ]
