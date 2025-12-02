import { createApiEndpoint, fetchOptions } from './utils';

export interface DataSource {
    id: string;
    name: string;
    assetCount: number;
    lastUpdated: string | null;
    owner: string;
}

export const fetchDataSources = async (): Promise<DataSource[]> => {
    const response = await fetch(createApiEndpoint('datasources/'), fetchOptions);

    if (!response.ok) {
        throw new Error(`Failed to fetch data sources: ${response.statusText}`);
    }

    return await response.json();
};
