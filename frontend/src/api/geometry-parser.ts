import { centroid } from '@turf/turf';
import type { Polygon, MultiPolygon, Geometry, Point, MultiPoint, LineString, MultiLineString } from 'geojson';

function normalizeGeometryString(geomString: string): string {
    return geomString.includes(';') ? geomString.split(';')[1] : geomString;
}

export function parseCoordinatePair(pair: string): [number, number] {
    const parts = pair.trim().split(/\s+/);
    const lng = Number.parseFloat(parts[0]);
    const lat = Number.parseFloat(parts[1]);
    return [lng, lat];
}

export function parseCoordinates(coordString: string): number[][] {
    const coordPairs = coordString.split(',').map((pair) => pair.trim());
    return coordPairs.filter((pair) => pair.length > 0).map(parseCoordinatePair);
}

export function parseNestedContent(contentString: string, onComplete: (content: string) => void): void {
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

export function parseRings(ringsString: string): number[][][] {
    const rings: number[][][] = [];

    parseNestedContent(ringsString, (ringContent) => {
        const coordinates = parseCoordinates(ringContent);
        if (coordinates.length > 0) {
            rings.push(coordinates);
        }
    });

    return rings;
}

function parsePointGeometryInternal(normalizedGeom: string): Point | null {
    const pointRegex = /POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/;
    const pointMatch = pointRegex.exec(normalizedGeom);
    if (!pointMatch) {
        return null;
    }

    const lng = Number.parseFloat(pointMatch[1]);
    const lat = Number.parseFloat(pointMatch[2]);

    return {
        type: 'Point',
        coordinates: [lng, lat],
    };
}

export function parsePointGeometry(geomString: string): Point | null {
    return parsePointGeometryInternal(normalizeGeometryString(geomString));
}

function parseMultiPointGeometryInternal(normalizedGeom: string): MultiPoint | null {
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
        return null;
    }

    return {
        type: 'MultiPoint',
        coordinates: points,
    };
}

export function parseMultiPointGeometry(geomString: string): MultiPoint | null {
    return parseMultiPointGeometryInternal(normalizeGeometryString(geomString));
}

function parseLineStringGeometryInternal(normalizedGeom: string): LineString | null {
    const lineStringRegex = /LINESTRING\s*\((.*)\)$/;
    const lineStringMatch = lineStringRegex.exec(normalizedGeom);
    if (!lineStringMatch) {
        return null;
    }

    const coordinates = parseCoordinates(lineStringMatch[1]);
    if (coordinates.length === 0) {
        return null;
    }

    return {
        type: 'LineString',
        coordinates: coordinates,
    };
}

export function parseLineStringGeometry(geomString: string): LineString | null {
    return parseLineStringGeometryInternal(normalizeGeometryString(geomString));
}

function parseMultiLineStringGeometryInternal(normalizedGeom: string): MultiLineString | null {
    const multiLineStringRegex = /MULTILINESTRING\s*\((.*)\)$/;
    const multiLineStringMatch = multiLineStringRegex.exec(normalizedGeom);
    if (!multiLineStringMatch) {
        return null;
    }

    const lines: number[][][] = [];
    parseNestedContent(multiLineStringMatch[1], (lineContent) => {
        const coordinates = parseCoordinates(lineContent);
        if (coordinates.length > 0) {
            lines.push(coordinates);
        }
    });

    if (lines.length === 0) {
        return null;
    }

    return {
        type: 'MultiLineString',
        coordinates: lines,
    };
}

export function parseMultiLineStringGeometry(geomString: string): MultiLineString | null {
    return parseMultiLineStringGeometryInternal(normalizeGeometryString(geomString));
}

function parsePolygonGeometryInternal(normalizedGeom: string): Polygon | null {
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

export function parsePolygonGeometry(geomString: string): Polygon | null {
    return parsePolygonGeometryInternal(normalizeGeometryString(geomString));
}

function parseMultiPolygonGeometryInternal(normalizedGeom: string): MultiPolygon | null {
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

export function parseMultiPolygonGeometry(geomString: string): MultiPolygon | null {
    return parseMultiPolygonGeometryInternal(normalizeGeometryString(geomString));
}

export function parseGeometry(geomString: string): Geometry | null {
    if (typeof geomString !== 'string') {
        return null;
    }

    const normalizedGeom = normalizeGeometryString(geomString);

    const multiPolygon = parseMultiPolygonGeometryInternal(normalizedGeom);
    if (multiPolygon) {
        return multiPolygon;
    }

    const polygon = parsePolygonGeometryInternal(normalizedGeom);
    if (polygon) {
        return polygon;
    }

    const multiLineString = parseMultiLineStringGeometryInternal(normalizedGeom);
    if (multiLineString) {
        return multiLineString;
    }

    const lineString = parseLineStringGeometryInternal(normalizedGeom);
    if (lineString) {
        return lineString;
    }

    const multiPoint = parseMultiPointGeometryInternal(normalizedGeom);
    if (multiPoint) {
        return multiPoint;
    }

    const point = parsePointGeometryInternal(normalizedGeom);
    if (point) {
        return point;
    }

    return null;
}

export function parseGeometryWithLocation(geom: string): { lat: number; lng: number; geometry: Geometry } {
    const normalizedGeom = normalizeGeometryString(geom);

    const multiPoint = parseMultiPointGeometryInternal(normalizedGeom);
    if (multiPoint) {
        const firstPoint = multiPoint.coordinates[0];
        return {
            lat: firstPoint[1],
            lng: firstPoint[0],
            geometry: multiPoint,
        };
    }

    const point = parsePointGeometryInternal(normalizedGeom);
    if (point) {
        return {
            lat: point.coordinates[1],
            lng: point.coordinates[0],
            geometry: point,
        };
    }

    const multiLineString = parseMultiLineStringGeometryInternal(normalizedGeom);
    if (multiLineString) {
        const firstPoint = multiLineString.coordinates[0][0];
        return {
            lat: firstPoint[1],
            lng: firstPoint[0],
            geometry: multiLineString,
        };
    }

    const lineString = parseLineStringGeometryInternal(normalizedGeom);
    if (lineString) {
        const firstPoint = lineString.coordinates[0];
        return {
            lat: firstPoint[1],
            lng: firstPoint[0],
            geometry: lineString,
        };
    }

    const multiPolygon = parseMultiPolygonGeometryInternal(normalizedGeom);
    if (multiPolygon) {
        const centroidPoint = centroid({ type: 'Feature', geometry: multiPolygon, properties: {} });
        const [lng, lat] = centroidPoint.geometry.coordinates;
        return {
            lat,
            lng,
            geometry: multiPolygon,
        };
    }

    const polygon = parsePolygonGeometryInternal(normalizedGeom);
    if (polygon) {
        const centroidPoint = centroid({ type: 'Feature', geometry: polygon, properties: {} });
        const [lng, lat] = centroidPoint.geometry.coordinates;
        return {
            lat,
            lng,
            geometry: polygon,
        };
    }

    throw new Error(`Unsupported geometry format: ${geom}`);
}
