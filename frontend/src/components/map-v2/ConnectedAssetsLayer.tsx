// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, Geometry } from 'geojson';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { ASSET_SYMBOL_LAYER_ID } from './AssetLayers';
import { parseGeometry, getLocationFromGeometry } from '@/api/geometry-parser';

const DEPENDENT_POLYGON_SOURCE_ID = 'connected-assets-dependent-polygon-source';
const DEPENDENT_POLYGON_LAYER_ID = 'connected-assets-dependent-polygon-layer';
const PROVIDER_POLYGON_SOURCE_ID = 'connected-assets-provider-polygon-source';
const PROVIDER_POLYGON_LAYER_ID = 'connected-assets-provider-polygon-layer';
const DEPENDENT_LINE_SOURCE_ID = 'connected-assets-dependent-line-source';
const DEPENDENT_LINE_LAYER_ID = 'connected-assets-dependent-line-layer';
const PROVIDER_LINE_SOURCE_ID = 'connected-assets-provider-line-source';
const PROVIDER_LINE_LAYER_ID = 'connected-assets-provider-line-layer';
const DEPENDENT_MARKER_SOURCE_ID = 'connected-assets-dependent-marker-source';
const DEPENDENT_MARKER_LAYER_ID = 'connected-assets-dependent-marker-layer';
const PROVIDER_MARKER_SOURCE_ID = 'connected-assets-provider-marker-source';
const PROVIDER_MARKER_LAYER_ID = 'connected-assets-provider-marker-layer';

const DEPENDENT_COLOR = '#d32f2f';
const PROVIDER_COLOR = '#1976d2';

type ConnectedAsset = {
    id: string;
    geom: string;
    type: { name: string };
};

type ConnectedAssetsLayerProps = {
    selectedAsset: { id: string; lat?: number; lng?: number; geom?: string } | null;
    dependents: ConnectedAsset[];
    providers: ConnectedAsset[];
    mapReady?: boolean;
};

type AssetFeatureData = {
    polygons: { type: 'FeatureCollection'; features: Feature[] };
    lines: { type: 'FeatureCollection'; features: Feature[] };
    markers: { type: 'FeatureCollection'; features: Feature[] };
};

const createEmptyFeatureData = (): AssetFeatureData => ({
    polygons: { type: 'FeatureCollection' as const, features: [] },
    lines: { type: 'FeatureCollection' as const, features: [] },
    markers: { type: 'FeatureCollection' as const, features: [] },
});

const getSelectedLocation = (selectedAsset: { id: string; lat?: number; lng?: number; geom?: string }): { lat: number; lng: number } | null => {
    const selectedGeometry = selectedAsset.geom ? parseGeometry(selectedAsset.geom) : null;
    if (selectedGeometry) {
        return getLocationFromGeometry(selectedGeometry);
    }

    if (selectedAsset.lat && selectedAsset.lng) {
        return { lat: selectedAsset.lat, lng: selectedAsset.lng };
    }

    return null;
};

const processConnectedAssets = (
    assets: ConnectedAsset[],
    selectedLocation: { lat: number; lng: number },
    assetType: 'dependent' | 'provider',
): AssetFeatureData => {
    const polygonFeatures: Feature[] = [];
    const lineFeatures: Feature[] = [];
    const markerFeatures: Feature[] = [];

    assets.forEach((asset) => {
        const geometry = parseGeometry(asset.geom);
        if (!geometry) {
            return;
        }

        const assetLocation = getLocationFromGeometry(geometry);
        if (!assetLocation) {
            return;
        }

        if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            polygonFeatures.push({
                type: 'Feature',
                properties: { id: asset.id, type: assetType },
                geometry: geometry as Geometry,
            });
        }

        markerFeatures.push({
            type: 'Feature',
            properties: { id: asset.id, type: assetType },
            geometry: {
                type: 'Point',
                coordinates: [assetLocation.lng, assetLocation.lat],
            },
        });

        lineFeatures.push({
            type: 'Feature',
            properties: { type: assetType },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [selectedLocation.lng, selectedLocation.lat],
                    [assetLocation.lng, assetLocation.lat],
                ],
            },
        });
    });

    return {
        polygons: { type: 'FeatureCollection' as const, features: polygonFeatures },
        lines: { type: 'FeatureCollection' as const, features: lineFeatures },
        markers: { type: 'FeatureCollection' as const, features: markerFeatures },
    };
};

const ConnectedAssetsLayer = ({ selectedAsset, dependents, providers, mapReady }: ConnectedAssetsLayerProps) => {
    const dependentData = useMemo(() => {
        if (!selectedAsset || dependents.length === 0) {
            return createEmptyFeatureData();
        }

        const selectedLocation = getSelectedLocation(selectedAsset);
        if (!selectedLocation) {
            return createEmptyFeatureData();
        }

        return processConnectedAssets(dependents, selectedLocation, 'dependent');
    }, [selectedAsset, dependents]);

    const providerData = useMemo(() => {
        if (!selectedAsset || providers.length === 0) {
            return createEmptyFeatureData();
        }

        const selectedLocation = getSelectedLocation(selectedAsset);
        if (!selectedLocation) {
            return createEmptyFeatureData();
        }

        return processConnectedAssets(providers, selectedLocation, 'provider');
    }, [selectedAsset, providers]);

    if (
        !mapReady ||
        (dependentData.polygons.features.length === 0 &&
            dependentData.markers.features.length === 0 &&
            providerData.polygons.features.length === 0 &&
            providerData.markers.features.length === 0)
    ) {
        return null;
    }

    return (
        <>
            {(dependentData.polygons.features.length > 0 || dependentData.markers.features.length > 0) && (
                <>
                    <Source id={DEPENDENT_POLYGON_SOURCE_ID} type="geojson" data={dependentData.polygons} generateId>
                        <Layer
                            id={DEPENDENT_POLYGON_LAYER_ID}
                            type="fill"
                            beforeId={ASSET_SYMBOL_LAYER_ID}
                            paint={{
                                'fill-color': DEPENDENT_COLOR,
                                'fill-opacity': 0.3,
                            }}
                        />
                        <Layer
                            id={`${DEPENDENT_POLYGON_LAYER_ID}-outline`}
                            type="line"
                            beforeId={ASSET_SYMBOL_LAYER_ID}
                            paint={{
                                'line-color': DEPENDENT_COLOR,
                                'line-width': 2,
                            }}
                        />
                    </Source>
                    {dependentData.lines.features.length > 0 && (
                        <Source id={DEPENDENT_LINE_SOURCE_ID} type="geojson" data={dependentData.lines} generateId>
                            <Layer
                                id={DEPENDENT_LINE_LAYER_ID}
                                type="line"
                                beforeId={ASSET_SYMBOL_LAYER_ID}
                                paint={{
                                    'line-color': DEPENDENT_COLOR,
                                    'line-width': 2,
                                }}
                            />
                        </Source>
                    )}
                    {dependentData.markers.features.length > 0 && (
                        <Source id={DEPENDENT_MARKER_SOURCE_ID} type="geojson" data={dependentData.markers} generateId>
                            <Layer
                                id={DEPENDENT_MARKER_LAYER_ID}
                                type="circle"
                                beforeId={ASSET_SYMBOL_LAYER_ID}
                                paint={{
                                    'circle-radius': 8,
                                    'circle-color': DEPENDENT_COLOR,
                                    'circle-stroke-color': '#ffffff',
                                    'circle-stroke-width': 2,
                                }}
                            />
                        </Source>
                    )}
                </>
            )}
            {(providerData.polygons.features.length > 0 || providerData.markers.features.length > 0) && (
                <>
                    <Source id={PROVIDER_POLYGON_SOURCE_ID} type="geojson" data={providerData.polygons} generateId>
                        <Layer
                            id={PROVIDER_POLYGON_LAYER_ID}
                            type="fill"
                            beforeId={ASSET_SYMBOL_LAYER_ID}
                            paint={{
                                'fill-color': PROVIDER_COLOR,
                                'fill-opacity': 0.3,
                            }}
                        />
                        <Layer
                            id={`${PROVIDER_POLYGON_LAYER_ID}-outline`}
                            type="line"
                            beforeId={ASSET_SYMBOL_LAYER_ID}
                            paint={{
                                'line-color': PROVIDER_COLOR,
                                'line-width': 2,
                            }}
                        />
                    </Source>
                    {providerData.lines.features.length > 0 && (
                        <Source id={PROVIDER_LINE_SOURCE_ID} type="geojson" data={providerData.lines} generateId>
                            <Layer
                                id={PROVIDER_LINE_LAYER_ID}
                                type="line"
                                beforeId={ASSET_SYMBOL_LAYER_ID}
                                paint={{
                                    'line-color': PROVIDER_COLOR,
                                    'line-width': 2,
                                }}
                            />
                        </Source>
                    )}
                    {providerData.markers.features.length > 0 && (
                        <Source id={PROVIDER_MARKER_SOURCE_ID} type="geojson" data={providerData.markers} generateId>
                            <Layer
                                id={PROVIDER_MARKER_LAYER_ID}
                                type="circle"
                                beforeId={ASSET_SYMBOL_LAYER_ID}
                                paint={{
                                    'circle-radius': 8,
                                    'circle-color': PROVIDER_COLOR,
                                    'circle-stroke-color': '#ffffff',
                                    'circle-stroke-width': 2,
                                }}
                            />
                        </Source>
                    )}
                </>
            )}
        </>
    );
};

export default ConnectedAssetsLayer;
