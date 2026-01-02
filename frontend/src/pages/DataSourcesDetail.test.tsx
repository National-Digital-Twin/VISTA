import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';
import { fetchDataSource, fetchDataSources } from '@/api/datasources';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSource: vi.fn(),
    fetchDataSources: vi.fn(),
}));

const mockedFetchDataSources = vi.mocked(fetchDataSources);
const mockedFetchDataSource = vi.mocked(fetchDataSource);

const mockDataSources = [
    {
        id: 'cqc',
        name: 'CQC API',
        description: 'An API for CQC',
        assetCount: 63,
        lastUpdated: '2025-07-20T11:04:00Z',
        owner: 'John Doe',
    },
    {
        id: 'nhs',
        name: 'NHS Open Data Portal',
        description: 'An API for NHS',
        assetCount: 27,
        lastUpdated: '2025-07-21T09:31:00Z',
        owner: 'Jane Smith',
    },
    {
        id: 'os-names',
        name: 'OS Names',
        description: 'An API for OS Names',
        assetCount: 119,
        lastUpdated: null,
        owner: 'Bob Johnson',
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchDataSources.mockResolvedValue(mockDataSources);

    mockUseUserData.mockReturnValue({
        getUserDisplayName: () => 'Name',
        getUserEmailDomain: () => 'Email',
        getUserType: () => 'Admin',
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
    });
});
