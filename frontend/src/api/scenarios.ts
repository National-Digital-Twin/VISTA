import config from '@/config/app-config';

export type Scenario = {
    id: string;
    name: string;
    isActive: boolean;
};

export const fetchScenarios = async (): Promise<Scenario[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/scenarios/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
    }

    return response.json();
};
