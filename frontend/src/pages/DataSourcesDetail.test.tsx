// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDataSource, fetchDataSources, grantDataSourceGroupAccess, revokeDataSourceGroupAccess } from '@/api/datasources';
import { fetchAllGroups } from '@/api/groups';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSource: vi.fn(),
    fetchDataSources: vi.fn(),
    grantDataSourceGroupAccess: vi.fn(),
    revokeDataSourceGroupAccess: vi.fn(),
}));

vi.mock('@/api/groups', () => ({
    fetchAllGroups: vi.fn(),
}));

const mockedFetchDataSources = vi.mocked(fetchDataSources);
const mockedFetchDataSource = vi.mocked(fetchDataSource);
const mockedFetchAllGroups = vi.mocked(fetchAllGroups);
const mockedGrantDataSourceGroupAccess = vi.mocked(grantDataSourceGroupAccess);
const mockedRevokeDataSourceGroupAccess = vi.mocked(revokeDataSourceGroupAccess);

const mockDataSources = [
    {
        id: 'cqc',
        name: 'CQC API',
        description: 'An API for CQC',
        assetCount: 63,
        lastUpdated: '2025-07-20T11:04:00Z',
        owner: 'John Doe',
        globallyAvailable: true,
        groupsWithAccess: [],
    },
    {
        id: 'nhs',
        name: 'NHS Open Data Portal',
        description: 'An API for NHS',
        assetCount: 27,
        lastUpdated: '2025-07-21T09:31:00Z',
        owner: 'Jane Smith',
        globallyAvailable: false,
        groupsWithAccess: [{ id: 'g1', name: 'Resilience planning', members: ['m1'] }],
    },
    {
        id: 'os-names',
        name: 'OS Names',
        description: 'An API for OS Names',
        assetCount: 119,
        lastUpdated: null,
        owner: 'Bob Johnson',
        globallyAvailable: false,
        groupsWithAccess: [{ id: 'g2', name: 'Twynwell team', members: ['m1', 'm2'] }],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchDataSources.mockResolvedValue(mockDataSources);
    mockedFetchAllGroups.mockResolvedValue([
        { id: 'g1', name: 'Resilience planning', members: [] },
        { id: 'g2', name: 'Twynwell team', members: [] },
    ]);
    mockedGrantDataSourceGroupAccess.mockResolvedValue();
    mockedRevokeDataSourceGroupAccess.mockResolvedValue();

    mockUseUserData.mockReturnValue({
        getUserDisplayName: () => 'Name',
        getUserEmailDomain: () => 'Email',
        getUserType: () => 'Admin',
        isAdmin: true,
    });

    sessionStorage.clear();
});

describe('DataSourceDetail', () => {
    it('renders the data source detail', async () => {
        const dataSource = mockDataSources[0];
        mockedFetchDataSource.mockResolvedValue(dataSource);
        renderWithAppProviders([`/data-room/data-source/${dataSource.id}`]);
        expect(fetchDataSource).toHaveBeenCalledWith(dataSource.id);
        expect(await screen.findByText(dataSource.name)).toBeInTheDocument();
        expect(await screen.findByText(dataSource.description)).toBeInTheDocument();
        expect(await screen.findByText('Should this data be available to all?')).toBeInTheDocument();
    });

    it('shows group assignment controls when No is selected', async () => {
        const dataSource = mockDataSources[0];
        mockedFetchDataSource.mockResolvedValue(dataSource);
        renderWithAppProviders([`/data-room/data-source/${dataSource.id}`]);

        const noOption = await screen.findByRole('radio', { name: 'No' });
        fireEvent.click(noOption);

        expect(await screen.findByText('Assign access to groups')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for group')).toBeInTheDocument();
    });

    it('disables save when restricted mode is chosen but no groups are selected', async () => {
        const dataSource = mockDataSources[0];
        mockedFetchDataSource.mockResolvedValue(dataSource);
        renderWithAppProviders([`/data-room/data-source/${dataSource.id}`]);

        fireEvent.click(await screen.findByRole('radio', { name: 'No' }));

        const saveButton = screen.getByRole('button', { name: 'SAVE' });
        expect(saveButton).toBeDisabled();
    });

    it('saves selected group access when restricted mode is chosen', async () => {
        const dataSource = mockDataSources[0];
        mockedFetchDataSource.mockResolvedValue(dataSource);
        renderWithAppProviders([`/data-room/data-source/${dataSource.id}`]);

        fireEvent.click(await screen.findByRole('radio', { name: 'No' }));
        const checkboxes = await screen.findAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        const saveButton = screen.getByRole('button', { name: 'SAVE' });
        expect(saveButton).toBeEnabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockedGrantDataSourceGroupAccess).toHaveBeenCalled();
        });
    });

    it('shows permission error when General user tries to save group access', async () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'Name',
            getUserEmailDomain: () => 'Email',
            getUserType: () => 'General',
            isAdmin: false,
        });
        const dataSource = mockDataSources[0];
        mockedFetchDataSource.mockResolvedValue(dataSource);
        renderWithAppProviders([`/data-room/data-source/${dataSource.id}`]);

        fireEvent.click(await screen.findByRole('radio', { name: 'No' }));
        const checkboxes = await screen.findAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        const saveButton = screen.getByRole('button', { name: 'SAVE' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('You do not have permission to change Group Access.')).toBeInTheDocument();
        });
        expect(mockedGrantDataSourceGroupAccess).not.toHaveBeenCalled();
        expect(mockedRevokeDataSourceGroupAccess).not.toHaveBeenCalled();
    });
});
