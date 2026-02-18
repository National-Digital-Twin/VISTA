import type { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';
import { fetchScenarios } from '@/api/scenarios';
import { fetchDataroomAssets } from '@/api/dataroom-assets';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

vi.mock('@/api/dataroom-assets', () => ({
    fetchDataroomAssets: vi.fn(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/asset-categories', () => ({
    fetchAssetCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/hooks/useAssetTypeIcons', () => ({
    useAssetTypeIcons: () => new Map(),
}));

vi.mock('@/components/DataroomMap', () => ({
    default: ({ children }: { children?: ReactNode }) => <div data-testid="dataroom-map">{children}</div>,
}));

vi.mock('@/components/map-v2/AssetLayers', () => ({
    default: () => <div data-testid="asset-layers" />,
}));

const mockedFetchScenarios = vi.mocked(fetchScenarios);
const mockedFetchDataroomAssets = vi.mocked(fetchDataroomAssets);

const mockScenarios = [
    { id: 'flood-newport', name: 'Flood in Newport', isActive: true, code: 'F001' },
    { id: 'landslide-ventnor', name: 'Landslide in Ventnor', isActive: false, code: 'L001' },
];

const mockAssets = [
    {
        id: 'asset-1',
        name: 'Hospital A',
        geometry: { type: 'Point' as const, coordinates: [-3, 51.5] },
        assetTypeId: 'type-1',
        assetTypeName: 'Hospital',
        subCategoryName: 'Healthcare',
        categoryName: 'Health',
        criticalityScore: 8,
        criticalityIsOverridden: false,
    },
    {
        id: 'asset-2',
        name: 'School B',
        geometry: { type: 'Point' as const, coordinates: [-3.1, 51.6] },
        assetTypeId: 'type-2',
        assetTypeName: 'School',
        subCategoryName: 'Education',
        categoryName: 'Services',
        criticalityScore: 5,
        criticalityIsOverridden: false,
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchScenarios.mockResolvedValue(mockScenarios);
    mockedFetchDataroomAssets.mockResolvedValue(mockAssets);
    mockUseUserData.mockReturnValue({
        getUserDisplayName: () => 'Name',
        getUserEmailDomain: () => 'Email',
        getUserType: () => 'Admin',
        isAdmin: true,
    });
});

describe('EditScenario', () => {
    it('redirects non-admin users to data-room', () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'Name',
            getUserEmailDomain: () => 'Email',
            getUserType: () => 'General',
            isAdmin: false,
        });
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        expect(screen.queryByText('F001')).not.toBeInTheDocument();
    });

    it('renders loading state', () => {
        mockedFetchScenarios.mockReturnValue(new Promise(() => {}));
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders scenario header with code and name', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        expect(await screen.findByText('F001')).toBeInTheDocument();
        expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
    });

    it('renders SAVE button', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('F001');

        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders back button', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('F001');

        expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
    });

    it('renders the map', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('F001');

        expect(screen.getByTestId('dataroom-map')).toBeInTheDocument();
    });

    it('renders asset table with data', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        expect(await screen.findByText('Hospital A')).toBeInTheDocument();
        expect(screen.getByText('School B')).toBeInTheDocument();
        expect(screen.getByText('Hospital')).toBeInTheDocument();
        expect(screen.getByText('School')).toBeInTheDocument();
    });

    it('shows not found for invalid scenario id', async () => {
        renderWithAppProviders(['/data-room/scenarios/nonexistent/edit']);

        await waitFor(() => {
            expect(screen.getByText('Scenario not found.')).toBeInTheDocument();
        });
    });

    it('shows not found when scenario fetch fails', async () => {
        mockedFetchScenarios.mockRejectedValue(new Error('Scenario error'));
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        await waitFor(() => {
            expect(screen.getByText('Scenario not found.')).toBeInTheDocument();
        });
    });

    it('displays error snackbar on asset fetch error', async () => {
        mockedFetchDataroomAssets.mockRejectedValue(new Error('Asset error'));
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);

        await waitFor(() => {
            expect(screen.getByText('Asset error')).toBeInTheDocument();
        });
    });
});
