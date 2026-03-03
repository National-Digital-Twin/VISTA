import type { Geometry } from 'geojson';
import { describe, it, expect } from 'vitest';
import {
    parseCoordinatePair,
    parseCoordinates,
    parseNestedContent,
    parseRings,
    parsePointGeometry,
    parseMultiPointGeometry,
    parseLineStringGeometry,
    parseMultiLineStringGeometry,
    parsePolygonGeometry,
    parseMultiPolygonGeometry,
    parseGeometry,
    parseGeometryWithLocation,
    getLocationFromGeometry,
} from './geometry-parser';

describe('geometry-parser', () => {
    describe('parseCoordinatePair', () => {
        it('parses a coordinate pair correctly', () => {
            const result = parseCoordinatePair('-1.4 50.67');
            expect(result).toEqual([-1.4, 50.67]);
        });

        it('handles whitespace correctly', () => {
            const result = parseCoordinatePair('  -1.4   50.67  ');
            expect(result).toEqual([-1.4, 50.67]);
        });

        it('handles negative coordinates', () => {
            const result = parseCoordinatePair('-180 -90');
            expect(result).toEqual([-180, -90]);
        });
    });

    describe('parseCoordinates', () => {
        it('parses multiple coordinate pairs', () => {
            const result = parseCoordinates('-1.4 50.67, -1.4 50.68, -1.39 50.68');
            expect(result).toEqual([
                [-1.4, 50.67],
                [-1.4, 50.68],
                [-1.39, 50.68],
            ]);
        });

        it('handles whitespace around commas', () => {
            const result = parseCoordinates(' -1.4 50.67 , -1.4 50.68 ');
            expect(result).toEqual([
                [-1.4, 50.67],
                [-1.4, 50.68],
            ]);
        });

        it('filters out empty pairs', () => {
            const result = parseCoordinates('-1.4 50.67, , -1.4 50.68');
            expect(result).toEqual([
                [-1.4, 50.67],
                [-1.4, 50.68],
            ]);
        });
    });

    describe('parseNestedContent', () => {
        it('extracts nested content correctly', () => {
            const results: string[] = [];
            parseNestedContent('(content1)(content2)', (content) => {
                results.push(content);
            });
            expect(results).toEqual(['content1', 'content2']);
        });

        it('handles deeply nested content', () => {
            const results: string[] = [];
            parseNestedContent('(outer(inner)outer)', (content) => {
                results.push(content);
            });
            expect(results).toEqual(['outer(inner)outer']);
        });

        it('handles empty nested content', () => {
            const results: string[] = [];
            parseNestedContent('()', (content) => {
                results.push(content);
            });
            expect(results).toEqual(['']);
        });
    });

    describe('parseRings', () => {
        it('parses polygon rings correctly', () => {
            const result = parseRings('(-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)');
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual([
                [-1.4, 50.67],
                [-1.4, 50.68],
                [-1.39, 50.68],
                [-1.39, 50.67],
                [-1.4, 50.67],
            ]);
        });

        it('parses multiple rings', () => {
            const result = parseRings(
                '(-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)(-1.5 50.77, -1.5 50.78, -1.49 50.78, -1.49 50.77, -1.5 50.77)',
            );
            expect(result).toHaveLength(2);
        });
    });

    describe('parsePointGeometry', () => {
        it('parses a point with SRID prefix', () => {
            const result = parsePointGeometry('SRID=4326;POINT (-1.4 50.67)');
            expect(result).toEqual({
                type: 'Point',
                coordinates: [-1.4, 50.67],
            });
        });

        it('parses a point without SRID prefix', () => {
            const result = parsePointGeometry('POINT (-1.4 50.67)');
            expect(result).toEqual({
                type: 'Point',
                coordinates: [-1.4, 50.67],
            });
        });

        it('returns null for invalid format', () => {
            const result = parsePointGeometry('INVALID');
            expect(result).toBeNull();
        });
    });

    describe('parseMultiPointGeometry', () => {
        it('parses multipoint with SRID prefix', () => {
            const result = parseMultiPointGeometry('SRID=4326;MULTIPOINT ((-1.4 50.67), (-1.4 50.68))');
            expect(result).toEqual({
                type: 'MultiPoint',
                coordinates: [
                    [-1.4, 50.67],
                    [-1.4, 50.68],
                ],
            });
        });

        it('returns null for invalid format', () => {
            const result = parseMultiPointGeometry('INVALID');
            expect(result).toBeNull();
        });

        it('returns null for empty multipoint', () => {
            const result = parseMultiPointGeometry('SRID=4326;MULTIPOINT ()');
            expect(result).toBeNull();
        });
    });

    describe('parseLineStringGeometry', () => {
        it('parses linestring with SRID prefix', () => {
            const result = parseLineStringGeometry('SRID=4326;LINESTRING (-1.4 50.67, -1.4 50.68, -1.39 50.68)');
            expect(result).toEqual({
                type: 'LineString',
                coordinates: [
                    [-1.4, 50.67],
                    [-1.4, 50.68],
                    [-1.39, 50.68],
                ],
            });
        });

        it('returns null for invalid format', () => {
            const result = parseLineStringGeometry('INVALID');
            expect(result).toBeNull();
        });

        it('returns null for empty linestring', () => {
            const result = parseLineStringGeometry('SRID=4326;LINESTRING ()');
            expect(result).toBeNull();
        });
    });

    describe('parseMultiLineStringGeometry', () => {
        it('parses multilinestring with SRID prefix', () => {
            const result = parseMultiLineStringGeometry('SRID=4326;MULTILINESTRING ((-1.4 50.67, -1.4 50.68), (-1.5 50.77, -1.5 50.78))');
            expect(result).toEqual({
                type: 'MultiLineString',
                coordinates: [
                    [
                        [-1.4, 50.67],
                        [-1.4, 50.68],
                    ],
                    [
                        [-1.5, 50.77],
                        [-1.5, 50.78],
                    ],
                ],
            });
        });

        it('returns null for invalid format', () => {
            const result = parseMultiLineStringGeometry('INVALID');
            expect(result).toBeNull();
        });

        it('returns null for empty multilinestring', () => {
            const result = parseMultiLineStringGeometry('SRID=4326;MULTILINESTRING ()');
            expect(result).toBeNull();
        });
    });

    describe('parsePolygonGeometry', () => {
        it('parses polygon with SRID prefix', () => {
            const result = parsePolygonGeometry('SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))');
            expect(result).toEqual({
                type: 'Polygon',
                coordinates: [
                    [
                        [-1.4, 50.67],
                        [-1.4, 50.68],
                        [-1.39, 50.68],
                        [-1.39, 50.67],
                        [-1.4, 50.67],
                    ],
                ],
            });
        });

        it('parses polygon without SRID prefix', () => {
            const result = parsePolygonGeometry('POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))');
            expect(result).not.toBeNull();
            expect(result?.type).toBe('Polygon');
        });

        it('returns null for invalid format', () => {
            const result = parsePolygonGeometry('INVALID');
            expect(result).toBeNull();
        });

        it('returns null for empty polygon', () => {
            const result = parsePolygonGeometry('SRID=4326;POLYGON ()');
            expect(result).toBeNull();
        });
    });

    describe('parseMultiPolygonGeometry', () => {
        it('parses multipolygon with SRID prefix', () => {
            const result = parseMultiPolygonGeometry('SRID=4326;MULTIPOLYGON (((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)))');
            expect(result).toEqual({
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [-1.4, 50.67],
                            [-1.4, 50.68],
                            [-1.39, 50.68],
                            [-1.39, 50.67],
                            [-1.4, 50.67],
                        ],
                    ],
                ],
            });
        });

        it('returns null for invalid format', () => {
            const result = parseMultiPolygonGeometry('INVALID');
            expect(result).toBeNull();
        });

        it('returns null for empty multipolygon', () => {
            const result = parseMultiPolygonGeometry('SRID=4326;MULTIPOLYGON ()');
            expect(result).toBeNull();
        });
    });

    describe('parseGeometry', () => {
        it('parses multipolygon geometry', () => {
            const result = parseGeometry('SRID=4326;MULTIPOLYGON (((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)))');
            expect(result?.type).toBe('MultiPolygon');
        });

        it('parses polygon geometry', () => {
            const result = parseGeometry('SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))');
            expect(result?.type).toBe('Polygon');
        });

        it('parses multilinestring geometry', () => {
            const result = parseGeometry('SRID=4326;MULTILINESTRING ((-1.4 50.67, -1.4 50.68))');
            expect(result?.type).toBe('MultiLineString');
        });

        it('parses linestring geometry', () => {
            const result = parseGeometry('SRID=4326;LINESTRING (-1.4 50.67, -1.4 50.68)');
            expect(result?.type).toBe('LineString');
        });

        it('parses multipoint geometry', () => {
            const result = parseGeometry('SRID=4326;MULTIPOINT ((-1.4 50.67), (-1.4 50.68))');
            expect(result?.type).toBe('MultiPoint');
        });

        it('parses point geometry', () => {
            const result = parseGeometry('SRID=4326;POINT (-1.4 50.67)');
            expect(result?.type).toBe('Point');
        });

        it('returns null for non-string input', () => {
            const result = parseGeometry(null as any);
            expect(result).toBeNull();
        });

        it('returns null for unsupported format', () => {
            const result = parseGeometry('INVALID_FORMAT');
            expect(result).toBeNull();
        });
    });

    describe('parseGeometryWithLocation', () => {
        it('parses multipoint and returns first point location', () => {
            const result = parseGeometryWithLocation('SRID=4326;MULTIPOINT ((-1.4 50.67), (-1.5 50.77))');
            expect(result.geometry.type).toBe('MultiPoint');
            expect(result.lat).toBe(50.67);
            expect(result.lng).toBe(-1.4);
        });

        it('parses point and returns point location', () => {
            const result = parseGeometryWithLocation('SRID=4326;POINT (-1.4 50.67)');
            expect(result.geometry.type).toBe('Point');
            expect(result.lat).toBe(50.67);
            expect(result.lng).toBe(-1.4);
        });

        it('parses multilinestring and returns first point location', () => {
            const result = parseGeometryWithLocation('SRID=4326;MULTILINESTRING ((-1.4 50.67, -1.4 50.68), (-1.5 50.77, -1.5 50.78))');
            expect(result.geometry.type).toBe('MultiLineString');
            expect(result.lat).toBe(50.67);
            expect(result.lng).toBe(-1.4);
        });

        it('parses linestring and returns first point location', () => {
            const result = parseGeometryWithLocation('SRID=4326;LINESTRING (-1.4 50.67, -1.4 50.68)');
            expect(result.geometry.type).toBe('LineString');
            expect(result.lat).toBe(50.67);
            expect(result.lng).toBe(-1.4);
        });

        it('parses multipolygon and returns centroid location', () => {
            const result = parseGeometryWithLocation('SRID=4326;MULTIPOLYGON (((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67)))');
            expect(result.geometry.type).toBe('MultiPolygon');
            expect(typeof result.lat).toBe('number');
            expect(typeof result.lng).toBe('number');
        });

        it('parses polygon and returns centroid location', () => {
            const result = parseGeometryWithLocation('SRID=4326;POLYGON ((-1.4 50.67, -1.4 50.68, -1.39 50.68, -1.39 50.67, -1.4 50.67))');
            expect(result.geometry.type).toBe('Polygon');
            expect(typeof result.lat).toBe('number');
            expect(typeof result.lng).toBe('number');
        });

        it('throws error for unsupported format', () => {
            expect(() => {
                parseGeometryWithLocation('INVALID_FORMAT');
            }).toThrow('Unsupported geometry format: INVALID_FORMAT');
        });
    });

    describe('getLocationFromGeometry', () => {
        it('extracts location from Point geometry', () => {
            const geometry: Geometry = {
                type: 'Point',
                coordinates: [-1.4, 50.67],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toEqual({ lat: 50.67, lng: -1.4 });
        });

        it('extracts first point from MultiPoint geometry', () => {
            const geometry: Geometry = {
                type: 'MultiPoint',
                coordinates: [
                    [-1.4, 50.67],
                    [-1.5, 50.68],
                ],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toEqual({ lat: 50.67, lng: -1.4 });
        });

        it('returns null for empty MultiPoint geometry', () => {
            const geometry: Geometry = {
                type: 'MultiPoint',
                coordinates: [],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('extracts first point from LineString geometry', () => {
            const geometry: Geometry = {
                type: 'LineString',
                coordinates: [
                    [-1.4, 50.67],
                    [-1.5, 50.68],
                    [-1.6, 50.69],
                ],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toEqual({ lat: 50.67, lng: -1.4 });
        });

        it('returns null for empty LineString geometry', () => {
            const geometry: Geometry = {
                type: 'LineString',
                coordinates: [],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('extracts first point from MultiLineString geometry', () => {
            const geometry: Geometry = {
                type: 'MultiLineString',
                coordinates: [
                    [
                        [-1.4, 50.67],
                        [-1.5, 50.68],
                    ],
                    [
                        [-2, 51],
                        [-2.1, 51.1],
                    ],
                ],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toEqual({ lat: 50.67, lng: -1.4 });
        });

        it('returns null for empty MultiLineString geometry', () => {
            const geometry: Geometry = {
                type: 'MultiLineString',
                coordinates: [],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('returns null for MultiLineString with empty first line', () => {
            const geometry: Geometry = {
                type: 'MultiLineString',
                coordinates: [[]],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('extracts centroid from Polygon geometry', () => {
            const geometry: Geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1.4, 50.67],
                        [-1.4, 50.68],
                        [-1.39, 50.68],
                        [-1.39, 50.67],
                        [-1.4, 50.67],
                    ],
                ],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).not.toBeNull();
            expect(result!.lat).toBeCloseTo(50.675);
            expect(result!.lng).toBeCloseTo(-1.395);
        });

        it('returns null for empty Polygon geometry', () => {
            const geometry: Geometry = {
                type: 'Polygon',
                coordinates: [],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('returns null for Polygon with empty ring', () => {
            const geometry: Geometry = {
                type: 'Polygon',
                coordinates: [[]],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('extracts centroid from MultiPolygon geometry', () => {
            const geometry: Geometry = {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [-1.4, 50.67],
                            [-1.4, 50.68],
                            [-1.39, 50.68],
                            [-1.39, 50.67],
                            [-1.4, 50.67],
                        ],
                    ],
                ],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).not.toBeNull();
            expect(result!.lat).toBeCloseTo(50.675);
            expect(result!.lng).toBeCloseTo(-1.395);
        });

        it('returns null for empty MultiPolygon geometry', () => {
            const geometry: Geometry = {
                type: 'MultiPolygon',
                coordinates: [],
            };
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });

        it('returns null for unsupported geometry type', () => {
            const geometry = {
                type: 'GeometryCollection',
                geometries: [],
            } as unknown as Geometry;
            const result = getLocationFromGeometry(geometry);
            expect(result).toBeNull();
        });
    });
});
