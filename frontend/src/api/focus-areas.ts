import type { Geometry } from 'geojson';
import config from '@/config/app-config';

export type FocusArea = {
    id: string;
    name: string;
    geometry: Geometry | null;
    filterMode: 'by_asset_type' | 'by_score_only';
    isActive: boolean;
    isSystem: boolean;
};

export type CreateFocusAreaRequest = {
    geometry: Geometry;
    name?: string;
    isActive?: boolean;
};

export type UpdateFocusAreaRequest = {
    name?: string;
    geometry?: Geometry;
    filterMode?: 'by_asset_type' | 'by_score_only';
    isActive?: boolean;
};

export const fetchFocusAreas = async (scenarioId: string): Promise<FocusArea[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/focus-areas/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch focus areas: ${response.statusText}`);
    }

    return response.json();
};

export const createFocusArea = async (scenarioId: string, data: CreateFocusAreaRequest): Promise<FocusArea> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/focus-areas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            geometry: data.geometry,
            name: data.name ?? '',
            isActive: data.isActive ?? true,
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to create focus area: ${response.statusText}`);
    }

    return response.json();
};

export const updateFocusArea = async (scenarioId: string, focusAreaId: string, data: UpdateFocusAreaRequest): Promise<FocusArea> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/focus-areas/${focusAreaId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to update focus area: ${response.statusText}`);
    }

    return response.json();
};

export const deleteFocusArea = async (scenarioId: string, focusAreaId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/focus-areas/${focusAreaId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to delete focus area: ${response.statusText}`);
    }
};
