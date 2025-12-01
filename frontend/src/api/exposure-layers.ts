import type { FeatureCollection, Feature, Polygon, MultiPolygon, Geometry } from 'geojson';
import { createNdtpPythonEndpoint, fetchOptions } from './utils';

function parseCoordinatePair(pair: string): [number, number] {
    const parts = pair.trim().split(/\s+/);
    const lng = Number.parseFloat(parts[0]);
    const lat = Number.parseFloat(parts[1]);
    return [lng, lat];
}

function parseCoordinates(coordString: string): number[][] {
    const coordPairs = coordString.split(',').map((pair) => pair.trim());
    return coordPairs.filter((pair) => pair.length > 0).map(parseCoordinatePair);
}

function parseNestedContent(contentString: string, onComplete: (content: string) => void): void {
    let currentContent = '';
    let depth = 0;

    for (const char of contentString) {
        if (char === '(') {
            depth++;
            if (depth === 1) {
                currentContent = '';
                continue;
            }
        } else if (char === ')') {
            depth--;
            if (depth === 0) {
                onComplete(currentContent);
                currentContent = '';
                continue;
            }
        }

        if (depth > 0) {
            currentContent += char;
        }
    }
}

function parseRings(ringsString: string): number[][][] {
    const rings: number[][][] = [];

    parseNestedContent(ringsString, (ringContent) => {
        const coordinates = parseCoordinates(ringContent);
        if (coordinates.length > 0) {
            rings.push(coordinates);
        }
    });

    return rings;
}

function parsePolygonGeometry(geomString: string): Polygon | null {
    const normalizedGeom = geomString.includes(';') ? geomString.split(';')[1] : geomString;
    const polygonRegex = /POLYGON\s*\((.*)\)$/;
    const polygonMatch = polygonRegex.exec(normalizedGeom);
    if (!polygonMatch) {
        return null;
    }

    const rings = parseRings(polygonMatch[1]);
    if (rings.length === 0) {
        return null;
    }

    return {
        type: 'Polygon',
        coordinates: rings,
    };
}

function parseMultiPolygonGeometry(geomString: string): MultiPolygon | null {
    const normalizedGeom = geomString.includes(';') ? geomString.split(';')[1] : geomString;
    const multiPolygonRegex = /MULTIPOLYGON\s*\((.*)\)$/;
    const multiPolygonMatch = multiPolygonRegex.exec(normalizedGeom);
    if (!multiPolygonMatch) {
        return null;
    }

    const polygons: number[][][][] = [];
    parseNestedContent(multiPolygonMatch[1], (polygonContent) => {
        const rings = parseRings(polygonContent);
        if (rings.length > 0) {
            polygons.push(rings);
        }
    });

    if (polygons.length === 0) {
        return null;
    }

    return {
        type: 'MultiPolygon',
        coordinates: polygons,
    };
}

function parseGeometry(geomString: string): Geometry | null {
    if (typeof geomString !== 'string') {
        return null;
    }

    const multiPolygon = parseMultiPolygonGeometry(geomString);
    if (multiPolygon) {
        return multiPolygon;
    }

    const polygon = parsePolygonGeometry(geomString);
    if (polygon) {
        return polygon;
    }

    console.warn('Unsupported geometry format:', geomString);
    return null;
}

export const fetchExposureLayers = async (): Promise<FeatureCollection> => {
    try {
        const response = await fetch(createNdtpPythonEndpoint('exposurelayers/'), fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve exposure layers: ${response.statusText}`);
        }

        const data = await response.json();

        const features: Feature[] = (data.features || [])
            .map((feature: any) => {
                const geometry = typeof feature.geometry === 'string' ? parseGeometry(feature.geometry) : feature.geometry;

                if (!geometry) {
                    console.warn('Failed to parse geometry for feature:', feature.id, feature.properties?.name);
                    return null;
                }

                return {
                    type: 'Feature',
                    id: feature.id,
                    geometry,
                    properties: feature.properties || {},
                };
            })
            .filter((feature: Feature | null): feature is Feature => feature !== null);

        return {
            type: 'FeatureCollection',
            features,
        };
    } catch (error) {
        console.error('Error fetching exposure layers:', error);
        throw error;
    }
};
