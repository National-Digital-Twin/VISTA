CREATE VIEW public.assets_within_500m_exposure_layers AS
SELECT a.id AS asset_id,
    e.id AS exposure_layer_id,
    ST_Intersects(a.geom, e.geometry) AS intersects
FROM api_exposurelayer e
JOIN api_exposurelayertype et ON e.type_id = et.id
    AND et.impacts_exposure_score
JOIN api_asset a ON ST_Intersects(a.geom, e.geometry_buffered);
