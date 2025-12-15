
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
