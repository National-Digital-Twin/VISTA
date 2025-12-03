export interface Scenario {
    id: string;
    name: string;
}

export const fetchScenarios = async (): Promise<Scenario[]> => {
    try {
        const response = await fetch('/api/scenarios');

        if (!response.ok) {
            throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
        }

        return await response.json();
    } catch {
        const response = await fetch('/data/scenarios.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch mock scenarios: ${response.statusText}`);
        }
        return await response.json();
    }
};
