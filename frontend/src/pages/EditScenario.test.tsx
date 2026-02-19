import type { ReactNode } from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';
import { fetchScenarios } from '@/api/scenarios';
import { fetchDataroomAssets, updateBulkCriticality } from '@/api/dataroom-assets';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

vi.mock('@/api/dataroom-assets', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/dataroom-assets')>();
    return {
        ...actual,
        fetchDataroomAssets: vi.fn(),
        updateBulkCriticality: vi.fn(),
    };
});

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
const mockedUpdateBulkCriticality = vi.mocked(updateBulkCriticality);

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
        criticalityScore: 3,
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
        criticalityScore: 1,
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

    it('shows EDIT ALL button when all assets are selected', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const headerCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(headerCheckbox);

        expect(await screen.findByRole('button', { name: /edit all/i })).toBeInTheDocument();
    });

    it('shows EDIT SELECTED button when assets are selected', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        expect(await screen.findByRole('button', { name: /edit 1 selected/i })).toBeInTheDocument();
    });

    it('opens edit dialog when EDIT SELECTED button is clicked', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        expect(await screen.findByText('Edit 1 item')).toBeInTheDocument();
        expect(screen.getByLabelText('Criticality score')).toBeInTheDocument();
    });

    it('calls bulk update API when dialog is confirmed', async () => {
        mockedUpdateBulkCriticality.mockResolvedValue({ updatedCount: 1 });
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));

        await waitFor(() => {
            expect(mockedUpdateBulkCriticality).toHaveBeenCalledWith('flood-newport', {
                assetIds: ['asset-1'],
                criticalityScore: 2,
            });
        });
    });
});
