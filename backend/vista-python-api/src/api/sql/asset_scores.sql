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
