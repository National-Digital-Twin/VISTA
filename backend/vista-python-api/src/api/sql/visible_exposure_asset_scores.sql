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
