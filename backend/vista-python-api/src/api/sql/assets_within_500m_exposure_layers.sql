CREATE MATERIALIZED VIEW public.assets_within_500m_exposure_layers AS
SELECT a.id AS asset_id,
    e.id AS exposure_layer_id,
    st_intersects(a.geom::geography, e.geometry::geography) AS intersects
FROM api_asset a
CROSS JOIN api_exposurelayer e
WHERE ST_DWithin(a.geom::geography, e.geometry::geography, 500);
