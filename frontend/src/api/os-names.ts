// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import proj4 from 'proj4';

const ISLE_OF_WIGHT_BBOX = '425000,80000,470000,97000';
const BRITISH_NATIONAL_GRID = 'EPSG:27700';
const WGS84 = 'EPSG:4326';
const MAX_API_RESULTS = 50;
const MAX_CLIENT_RESULTS = 10;

proj4.defs(
    BRITISH_NATIONAL_GRID,
    '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 ' +
        '+ellps=airy +datum=OSGB36 +units=m +no_defs +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489',
);

type OsNamesGazetteerEntry = {
    NAME1?: string;
    NAME2?: string;
    LOCAL_TYPE?: string;
    POPULATED_PLACE?: string;
    POSTCODE_DISTRICT?: string;
    GEOMETRY_X?: number | string;
    GEOMETRY_Y?: number | string;
    MBR_XMIN?: number | string;
    MBR_YMIN?: number | string;
    MBR_XMAX?: number | string;
    MBR_YMAX?: number | string;
};

type OsNamesResult = {
    GAZETTEER_ENTRY?: OsNamesGazetteerEntry;
};

type OsNamesResponse = {
    results?: OsNamesResult[];
};

export type OsNamesLocation = {
    name: string;
    localType?: string;
    populatedPlace?: string;
    label: string;
    lng: number;
    lat: number;
    bounds?: [[number, number], [number, number]];
};

const toNumber = (value: number | string | undefined): number | null => {
    if (value === undefined) {
        return null;
    }
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const osgbToWgs84 = (easting: number, northing: number): { lng: number; lat: number } => {
    const [lng, lat] = proj4(BRITISH_NATIONAL_GRID, WGS84, [easting, northing]);
    return { lng, lat };
};

const scoreNameMatch = (name: string, query: string): number => {
    const nameLower = name.toLowerCase();
    const queryLower = query.toLowerCase();

    if (nameLower === queryLower) {
        return 1000;
    }
    if (nameLower.startsWith(queryLower)) {
        return 500;
    }
    if (nameLower.includes(queryLower)) {
        return 250;
    }
    return 0;
};

const scoreLocalType = (localType?: string): number => {
    if (!localType) {
        return 0;
    }

    const localTypeLower = localType.toLowerCase();
    if (localTypeLower === 'town' || localTypeLower === 'city' || localTypeLower === 'village') {
        return 100;
    }
    return 0;
};

export const searchOsNamesLocations = async (query: string): Promise<OsNamesLocation[]> => {
    const params = new URLSearchParams({
        query,
        maxresults: String(MAX_API_RESULTS),
        fq: `BBOX:${ISLE_OF_WIGHT_BBOX}`,
    });

    const response = await fetch(`/transparent-proxy/os-names/search/names/v1/find?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`OS Names search failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OsNamesResponse;
    const mappedResults =
        payload.results
            ?.map((result, index): (OsNamesLocation & { _index: number; _score: number }) | null => {
                const entry = result.GAZETTEER_ENTRY;
                const easting = toNumber(entry?.GEOMETRY_X);
                const northing = toNumber(entry?.GEOMETRY_Y);
                if (!entry || easting === null || northing === null) {
                    return null;
                }
                const { lng, lat } = osgbToWgs84(easting, northing);
                const mbrXMin = toNumber(entry.MBR_XMIN);
                const mbrYMin = toNumber(entry.MBR_YMIN);
                const mbrXMax = toNumber(entry.MBR_XMAX);
                const mbrYMax = toNumber(entry.MBR_YMAX);
                const bounds =
                    mbrXMin !== null && mbrYMin !== null && mbrXMax !== null && mbrYMax !== null
                        ? ([
                              [osgbToWgs84(mbrXMin, mbrYMin).lng, osgbToWgs84(mbrXMin, mbrYMin).lat],
                              [osgbToWgs84(mbrXMax, mbrYMax).lng, osgbToWgs84(mbrXMax, mbrYMax).lat],
                          ] as [[number, number], [number, number]])
                        : undefined;
                const resolvedName = entry.NAME1 ?? entry.NAME2 ?? query;
                const resolvedPlace = entry.POPULATED_PLACE?.trim() || undefined;
                const localTypeSuffix = entry.LOCAL_TYPE ? ` (${entry.LOCAL_TYPE})` : '';
                const placeSuffix = resolvedPlace && resolvedPlace !== resolvedName ? `, ${resolvedPlace}` : '';
                return {
                    name: resolvedName,
                    label: `${resolvedName}${placeSuffix}${localTypeSuffix}`,
                    lng,
                    lat,
                    _index: index,
                    _score: scoreNameMatch(resolvedName, query) + scoreLocalType(entry.LOCAL_TYPE),
                    ...(entry.LOCAL_TYPE ? { localType: entry.LOCAL_TYPE } : {}),
                    ...(resolvedPlace ? { populatedPlace: resolvedPlace } : {}),
                    ...(bounds ? { bounds } : {}),
                };
            })
            .filter((item): item is OsNamesLocation & { _index: number; _score: number } => item !== null) ?? [];

    const sortedResults = [...mappedResults].sort((a, b) => {
        if (b._score !== a._score) {
            return b._score - a._score;
        }
        return a._index - b._index;
    });

    return sortedResults.slice(0, MAX_CLIENT_RESULTS).map(({ _index, _score, ...result }) => result);
};
