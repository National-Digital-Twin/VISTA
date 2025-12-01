import { centroid } from '@turf/turf';
import type { Polygon, Point, LineString, MultiLineString, MultiPolygon, MultiPoint, Geometry } from 'geojson';

import { createNdtpPythonEndpoint, fetchOptions } from './utils';
import Asset from '@/models/Asset';
import type { FoundIcon } from '@/hooks/useFindIcon';

export interface AssetTypeResponse {
    readonly id: string;
    readonly name: string;
    readonly geom: string;
    readonly type: {
        readonly id: string;
        readonly name: string;
    };
}

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

function parseMultiPoint(normalizedGeom: string, geom: string): { lat: number; lng: number; geometry: MultiPoint } | null {
    const multiPointRegex = /MULTIPOINT\s*\((.*)\)$/;
    const multiPointMatch = multiPointRegex.exec(normalizedGeom);
    if (!multiPointMatch) {
        return null;
    }

    const pointsString = multiPointMatch[1];
    const points: number[][] = [];

    parseNestedContent(pointsString, (pointContent) => {
        const coordinates = parseCoordinates(pointContent);
        if (coordinates.length > 0) {
            points.push(...coordinates);
        }
    });

    if (points.length === 0) {
        throw new Error(`Invalid multipoint format: ${geom}`);
    }

    const multiPoint: MultiPoint = {
        type: 'MultiPoint',
        coordinates: points,
    };

    const firstPoint = points[0];
    return {
        lat: firstPoint[1],
        lng: firstPoint[0],
        geometry: multiPoint,
    };
}

function parsePoint(normalizedGeom: string, _geom: string): { lat: number; lng: number; geometry: Point } | null {
    const pointRegex = /POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/;
    const pointMatch = pointRegex.exec(normalizedGeom);
    if (!pointMatch) {
        return null;
    }

    const lng = Number.parseFloat(pointMatch[1]);
    const lat = Number.parseFloat(pointMatch[2]);

    return {
        lat,
        lng,
        geometry: {
            type: 'Point',
            coordinates: [lng, lat],
        },
    };
}

function parseLineString(normalizedGeom: string, _geom: string): { lat: number; lng: number; geometry: LineString } | null {
    const lineStringRegex = /LINESTRING\s*\((.*)\)$/;
    const lineStringMatch = lineStringRegex.exec(normalizedGeom);
    if (!lineStringMatch) {
        return null;
    }

    const coordinates = parseCoordinates(lineStringMatch[1]);
    if (coordinates.length === 0) {
        throw new Error(`Invalid linestring format: ${_geom}`);
    }

    const lineString: LineString = {
        type: 'LineString',
        coordinates: coordinates,
    };

    const firstPoint = coordinates[0];
    return {
        lat: firstPoint[1],
        lng: firstPoint[0],
        geometry: lineString,
    };
}

function parseMultiLineStringLines(linesString: string): number[][][] {
    const lines: number[][][] = [];

    parseNestedContent(linesString, (lineContent) => {
        const coordinates = parseCoordinates(lineContent);
        if (coordinates.length > 0) {
            lines.push(coordinates);
        }
    });

    return lines;
}

function parseMultiLineString(normalizedGeom: string, geom: string): { lat: number; lng: number; geometry: MultiLineString } | null {
    const multiLineStringRegex = /MULTILINESTRING\s*\((.*)\)$/;
    const multiLineStringMatch = multiLineStringRegex.exec(normalizedGeom);
    if (!multiLineStringMatch) {
        return null;
    }

    const lines = parseMultiLineStringLines(multiLineStringMatch[1]);
    if (lines.length === 0) {
        throw new Error(`Invalid multilinestring format: ${geom}`);
    }

    const multiLineString: MultiLineString = {
        type: 'MultiLineString',
        coordinates: lines,
    };

    const firstPoint = lines[0][0];
    return {
        lat: firstPoint[1],
        lng: firstPoint[0],
        geometry: multiLineString,
    };
}

function parsePolygon(normalizedGeom: string, geom: string): { lat: number; lng: number; geometry: Polygon } | null {
    const polygonRegex = /POLYGON\s*\((.*)\)$/;
    const polygonMatch = polygonRegex.exec(normalizedGeom);
    if (!polygonMatch) {
        return null;
    }

    const rings = parseRings(polygonMatch[1]);
    if (rings.length === 0) {
        throw new Error(`Invalid polygon format: ${geom}`);
    }

    const polygon: Polygon = {
        type: 'Polygon',
        coordinates: rings,
    };

    const centroidPoint = centroid({ type: 'Feature', geometry: polygon, properties: {} });
    const [lng, lat] = centroidPoint.geometry.coordinates;

    return {
        lat,
        lng,
        geometry: polygon,
    };
}

function parseMultiPolygonPolygons(polygonsString: string): number[][][][] {
    const polygons: number[][][][] = [];

    parseNestedContent(polygonsString, (polygonContent) => {
        const rings = parseRings(polygonContent);
        if (rings.length > 0) {
            polygons.push(rings);
        }
    });

    return polygons;
}

function parseMultiPolygon(normalizedGeom: string, geom: string): { lat: number; lng: number; geometry: MultiPolygon } | null {
    const multiPolygonRegex = /MULTIPOLYGON\s*\((.*)\)$/;
    const multiPolygonMatch = multiPolygonRegex.exec(normalizedGeom);
    if (!multiPolygonMatch) {
        return null;
    }

    const polygons = parseMultiPolygonPolygons(multiPolygonMatch[1]);
    if (polygons.length === 0) {
        throw new Error(`Invalid multipolygon format: ${geom}`);
    }

    const multiPolygon: MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: polygons,
    };

    const centroidPoint = centroid({ type: 'Feature', geometry: multiPolygon, properties: {} });
    const [lng, lat] = centroidPoint.geometry.coordinates;

    return {
        lat,
        lng,
        geometry: multiPolygon,
    };
}

function parseGeometry(geom: string): { lat: number; lng: number; geometry: Geometry } {
    const normalizedGeom = geom.includes(';') ? geom.split(';')[1] : geom;

    const multiPointResult = parseMultiPoint(normalizedGeom, geom);
    if (multiPointResult) {
        return multiPointResult;
    }

    const pointResult = parsePoint(normalizedGeom, geom);
    if (pointResult) {
        return pointResult;
    }

    const multiLineStringResult = parseMultiLineString(normalizedGeom, geom);
    if (multiLineStringResult) {
        return multiLineStringResult;
    }

    const lineStringResult = parseLineString(normalizedGeom, geom);
    if (lineStringResult) {
        return lineStringResult;
    }

    const multiPolygonResult = parseMultiPolygon(normalizedGeom, geom);
    if (multiPolygonResult) {
        return multiPolygonResult;
    }

    const polygonResult = parsePolygon(normalizedGeom, geom);
    if (polygonResult) {
        return polygonResult;
    }

    throw new Error(`Unsupported geometry format: ${geom}`);
}

export const fetchAssetsByType = async (assetTypeId: string, iconMap?: Map<string, string>): Promise<Asset[]> => {
    try {
        const response = await fetch(`${createNdtpPythonEndpoint('assets/')}?asset_type=${encodeURIComponent(assetTypeId)}`, fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve assets for type ${assetTypeId}: ${response.statusText}`);
        }

        const data: AssetTypeResponse[] = await response.json();

        return data.map((item) => {
            const { lat, lng, geometry } = parseGeometry(item.geom);
            const icon = iconMap?.get(item.type.id);
            const iconName = icon?.replace('fa-', '');

            const defaultIconStyles: FoundIcon = {
                classUri: item.type.id,
                color: '#DDDDDD',
                backgroundColor: '#121212',
                faIcon: icon,
                iconFallbackText: iconName || '?',
                alt: item.type.name,
            };

            return new Asset({
                id: item.id,
                type: item.type.id,
                name: item.name,
                lat,
                lng,
                geometry,
                dependent: {
                    count: 0,
                    criticalitySum: 0,
                },
                styles: defaultIconStyles,
                secondaryCategory: item.type.name,
            });
        });
    } catch (error) {
        console.error(`Error fetching assets for type ${assetTypeId}:`, error);
        throw error;
    }
};
