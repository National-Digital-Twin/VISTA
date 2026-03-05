// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Point } from 'geojson';
import config from '@/config/app-config';

export interface ResourceLocation {
    id: string;
    name: string;
    geometry: Point;
    currentStock: number;
    maxCapacity: number;
    createdAt: string;
    updatedAt: string;
}

export interface ResourceType {
    id: string;
    name: string;
    unit: string;
    isActive: boolean;
    locations: ResourceLocation[];
}

export interface ResourceActionUser {
    id: string;
    name: string | null;
}

export interface ResourceAction {
    id: string;
    locationId: string;
    locationName: string;
    resourceType: string;
    actionType: 'withdraw' | 'restock';
    quantity: number;
    user: ResourceActionUser;
    createdAt: string;
}

export interface ResourceActionsResponse {
    totalCount: number;
    results: ResourceAction[];
    nextCursor: string | null;
}

export interface ResourceActionResponse {
    id: string;
    currentStock: number;
    maxCapacity: number;
    action: 'withdraw' | 'restock';
    quantity: number;
}

export interface ResourceTypeVisibilityToggleResponse {
    resourceInterventionTypeId: string;
    isActive: boolean;
}

export const fetchResourceInterventions = async (scenarioId: string): Promise<ResourceType[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch resource interventions: ${response.statusText}`);
    }

    return response.json();
};

export const fetchResourceInterventionLocation = async (scenarioId: string, locationId: string): Promise<ResourceLocation> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/locations/${locationId}/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch resource location: ${response.statusText}`);
    }

    return response.json();
};

export const withdrawStock = async (scenarioId: string, locationId: string, quantity: number): Promise<ResourceActionResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/locations/${locationId}/withdraw/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to withdraw stock: ${response.statusText}`);
    }

    return response.json();
};

export const restockLocation = async (scenarioId: string, locationId: string, quantity: number): Promise<ResourceActionResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/locations/${locationId}/restock/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `Failed to restock location: ${response.statusText}`);
    }

    return response.json();
};

export const fetchResourceInterventionActions = async (
    scenarioId: string,
    params?: { cursor?: string; limit?: number; typeId?: string },
): Promise<ResourceActionsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) {
        searchParams.set('cursor', params.cursor);
    }
    if (params?.limit) {
        searchParams.set('limit', String(params.limit));
    }
    if (params?.typeId) {
        searchParams.set('type_id', params.typeId);
    }

    const query = searchParams.toString();
    const querySuffix = query ? `?${query}` : '';
    const url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/actions/${querySuffix}`;

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch resource actions: ${response.statusText}`);
    }

    return response.json();
};

export const getResourceInterventionActionsExportUrl = (scenarioId: string, typeId: string): string => {
    return `${config.services.apiBaseUrl}/scenarios/${scenarioId}/resource-interventions/actions/export/?type_id=${typeId}`;
};

export const toggleResourceTypeVisibility = async (
    scenarioId: string,
    resourceTypeId: string,
    isActive: boolean,
): Promise<ResourceTypeVisibilityToggleResponse> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/visible-resource-intervention-types/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            resourceInterventionTypeId: resourceTypeId,
            isActive,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle resource type visibility: ${response.statusText}`);
    }

    return response.json();
};
