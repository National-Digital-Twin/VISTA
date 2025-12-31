import config from '@/config/app-config';

export type DataSource = {
    id: string;
    name: string;
    description: string;
    assetCount: number;
    lastUpdated: string | null;
    owner: string;
};

export const fetchDataSources = async (): Promise<DataSource[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/datasources/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data sources: ${response.statusText}`);
    }

    return await response.json();
};

export const fetchDataSource = async (id: string): Promise<DataSource> => {
    const response = await fetch(`${config.services.apiBaseUrl}/datasources/${id}/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch data sources: ${response.statusText}`);
    }

    return await response.json();
};
