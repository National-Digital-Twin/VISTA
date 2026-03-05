// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import config from '@/config/app-config';

export type ConstraintIntervention = {
    id: string;
    name: string;
    geometry: Geometry;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ConstraintInterventionType = {
    id: string;
    name: string;
    constraintInterventions: ConstraintIntervention[];
};

export type CreateConstraintInterventionRequest = {
    typeId: string;
    geometry: Geometry;
    name?: string;
};

export type UpdateConstraintInterventionRequest = {
    name?: string;
    geometry?: Geometry;
    isActive?: boolean;
};

export const fetchConstraintInterventions = async (scenarioId: string): Promise<ConstraintInterventionType[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/constraint-interventions/`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch constraint interventions: ${response.statusText}`);
    }

    return response.json();
};

export const createConstraintIntervention = async (scenarioId: string, data: CreateConstraintInterventionRequest): Promise<ConstraintIntervention> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/constraint-interventions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            typeId: data.typeId,
            geometry: data.geometry,
            ...(data.name && { name: data.name }),
        }),
    });
    if (!response.ok) {
        throw new Error(`Failed to create constraint intervention: ${response.statusText}`);
    }

    return response.json();
};

export const updateConstraintIntervention = async (
    scenarioId: string,
    interventionId: string,
    data: UpdateConstraintInterventionRequest,
): Promise<ConstraintIntervention> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/constraint-interventions/${interventionId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to update constraint intervention: ${response.statusText}`);
    }

    return response.json();
};

export const deleteConstraintIntervention = async (scenarioId: string, interventionId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${scenarioId}/constraint-interventions/${interventionId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to delete constraint intervention: ${response.statusText}`);
    }
};
