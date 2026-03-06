// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import config from '@/config/app-config';

export type Scenario = {
    id: string;
    name: string;
    isActive: boolean;
    code: string;
    pendingExposureCount?: number;
};

export const fetchScenarios = async (): Promise<Scenario[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
    }

    return response.json();
};

export const setActiveScenario = async (id: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/${id}/activate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to activate scenario: ${response.statusText}`);
    }
};
