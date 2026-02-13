import config from '@/config/app-config';

export type DataSource = {
    id: string;
    name: string;
    description: string;
    assetCount: number;
    lastUpdated: string | null;
    owner: string;
    globallyAvailable?: boolean;
    groupsWithAccess?: DataSourceAccessGroup[];
};

export type DataSourceAccessGroup = {
    id: string;
    name: string;
    members: string[];
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

export const grantDataSourceGroupAccess = async (dataSourceId: string, groupId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/datasources/${dataSourceId}/access/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: groupId }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to grant group access: ${response.statusText}`);
    }
};

export const revokeDataSourceGroupAccess = async (dataSourceId: string, groupId: string): Promise<void> => {
    const response = await fetch(`${config.services.apiBaseUrl}/datasources/${dataSourceId}/access/${groupId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to revoke group access: ${response.statusText}`);
    }
};
