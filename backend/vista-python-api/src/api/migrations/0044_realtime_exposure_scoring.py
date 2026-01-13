"""Replace materialized view with real-time view using pre-computed buffered geometry."""
# ruff: noqa: E501

from typing import ClassVar

from django.db import migrations


class Migration(migrations.Migration):
    """Replace assets_within_500m_exposure_layers materialized view with real-time view."""

    dependencies: ClassVar = [
        ("api", "0043_exposurelayer_geometry_buffered"),
    ]

    operations: ClassVar = [
        # New non-materialized view using the pre-computed geometry_buffered column
        # allowing fast intersection checks using GIST index, other views remain the same.
        # This allows the view to be updated in real-time to prepare for user created exposure layers.
        migrations.RunSQL(
            sql="""
                -- Drop existing views
                DROP VIEW IF EXISTS public.asset_scores CASCADE;
                DROP VIEW IF EXISTS public.visible_exposure_asset_scores CASCADE;
                DROP MATERIALIZED VIEW IF EXISTS public.assets_within_500m_exposure_layers CASCADE;

                -- Create new real-time view
                CREATE VIEW public.assets_within_500m_exposure_layers AS
                SELECT a.id AS asset_id,
                    e.id AS exposure_layer_id,
                    ST_Intersects(a.geom, e.geometry) AS intersects
                FROM api_exposurelayer e
                JOIN api_exposurelayertype et ON e.type_id = et.id
                    AND et.impacts_exposure_score
                JOIN api_asset a ON ST_Intersects(a.geom, e.geometry_buffered);

                -- Recreate visible_exposure_asset_scores (no changes)
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
                        GROUP BY active_exposure_layers.asset_id, active_exposure_layers.user_id, active_exposure_layers.scenario_id
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


                -- Recreate asset_scores view (no changes)
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
                        LEFT JOIN ( SELECT a_d.provider_asset_id AS id,
                                s_a_1.criticality_score AS score,
                                s_a_1.scenario_id AS scenario_id
                            FROM api_dependency a_d
                                LEFT JOIN api_asset a_1 ON a_d.dependent_asset_id = a_1.external_id
                                LEFT JOIN api_scenarioasset s_a_1 ON s_a_1.asset_type_id = a_1.type_id) dep_score ON dep_score.id = a.external_id AND dep_score.scenario_id = s_a.scenario_id
                        LEFT JOIN ( SELECT veas.asset_id,
                                veas.user_id,
                                veas.scenario_id,
                                veas.score
                            FROM visible_exposure_asset_scores veas
                            UNION ALL
                            SELECT veas.asset_id,
                                NULL::uuid AS user_id,
                                veas.scenario_id,
                                0 AS score
                            FROM visible_exposure_asset_scores veas) exposure ON exposure.asset_id = a.id AND exposure.scenario_id = s_a.scenario_id
                    GROUP BY a.id, s_a.scenario_id, exposure.user_id, s_a.criticality_score, exposure.score;
            """,
            reverse_sql="""
                -- Drop new views
                DROP VIEW IF EXISTS public.asset_scores CASCADE;
                DROP VIEW IF EXISTS public.visible_exposure_asset_scores CASCADE;
                DROP VIEW IF EXISTS public.assets_within_500m_exposure_layers CASCADE;

                -- Recreate original materialized view
                CREATE MATERIALIZED VIEW public.assets_within_500m_exposure_layers AS
                    SELECT a.id AS asset_id,
                        e.id AS exposure_layer_id,
                        st_intersects(a.geom::geography, e.geometry::geography) AS intersects
                    FROM api_asset a
                    CROSS JOIN
                        (SELECT e.id, e.geometry FROM api_exposurelayer e
                            JOIN public.api_exposurelayertype et
                            ON e.type_id = et.id
                            WHERE et.impacts_exposure_score) e
                    WHERE ST_DWithin(a.geom::geography, e.geometry::geography, 500);
                CREATE INDEX api_assets_within_500m_exposure_layers_exposure_layer_id
                    ON public.assets_within_500m_exposure_layers (exposure_layer_id);

                -- Recreate visible_exposure_asset_scores (no changes)
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
                        GROUP BY active_exposure_layers.asset_id, active_exposure_layers.user_id, active_exposure_layers.scenario_id
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


                -- Recreate asset_scores view (no changes)
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
                        LEFT JOIN ( SELECT a_d.provider_asset_id AS id,
                                s_a_1.criticality_score AS score,
                                s_a_1.scenario_id AS scenario_id
                            FROM api_dependency a_d
                                LEFT JOIN api_asset a_1 ON a_d.dependent_asset_id = a_1.external_id
                                LEFT JOIN api_scenarioasset s_a_1 ON s_a_1.asset_type_id = a_1.type_id) dep_score ON dep_score.id = a.external_id AND dep_score.scenario_id = s_a.scenario_id
                        LEFT JOIN ( SELECT veas.asset_id,
                                veas.user_id,
                                veas.scenario_id,
                                veas.score
                            FROM visible_exposure_asset_scores veas
                            UNION ALL
                            SELECT veas.asset_id,
                                NULL::uuid AS user_id,
                                veas.scenario_id,
                                0 AS score
                            FROM visible_exposure_asset_scores veas) exposure ON exposure.asset_id = a.id AND exposure.scenario_id = s_a.scenario_id
                    GROUP BY a.id, s_a.scenario_id, exposure.user_id, s_a.criticality_score, exposure.score;
            """,
        ),
    ]
