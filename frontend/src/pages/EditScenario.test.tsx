import { screen, waitFor, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDataroomAssets, updateBulkCriticality } from '@/api/dataroom-assets';
import { fetchScenarios } from '@/api/scenarios';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';

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

const waitForEditDialogToClose = async () => {
    await waitFor(() => {
        expect(screen.queryByLabelText('Criticality score')).not.toBeInTheDocument();
    });
};

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

    it('stores pending edit locally when dialog is confirmed without calling API', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const row = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(row);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            const hospitalRow = screen.getByText('Hospital A').closest('tr')!;
            expect(hospitalRow).toHaveTextContent('2');
        });
        expect(mockedUpdateBulkCriticality).not.toHaveBeenCalled();
    });

    it('shows discard dialog when clicking back with pending edits', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const hospitalRow = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(hospitalRow);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.getByText('Hospital A').closest('tr')).toHaveTextContent('2');
        });

        const backButton = screen.getByTestId('ArrowBackIcon').closest('button')!;
        fireEvent.click(backButton);

        expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    });

    it('navigates directly when clicking back with no pending edits', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('F001');

        const backButton = screen.getByTestId('ArrowBackIcon').closest('button')!;
        fireEvent.click(backButton);

        expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    });

    it('SAVE button is disabled when there are no pending edits', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('F001');

        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('shows save confirmation dialog with item count when SAVE is clicked', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const hospitalRow = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(hospitalRow);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByText('Save 1 item')).toBeInTheDocument();
        expect(screen.getByText(/saving criticality score changes for 1 item/i)).toBeInTheDocument();
    });

    it('calls API on save with pending edits and clears them on success', async () => {
        mockedUpdateBulkCriticality.mockResolvedValue({ updatedCount: 1 });
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const hospitalRow = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(hospitalRow);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await screen.findByText('Save 1 item');
        fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));

        await waitFor(() => {
            expect(mockedUpdateBulkCriticality).toHaveBeenCalledWith('flood-newport', {
                updates: [{ assetId: 'asset-1', criticalityScore: 2 }],
            });
        });

        await waitFor(
            () => {
                expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
            },
            { timeout: 10000 },
        );
    });

    it('saves multiple assets with different scores in a single request', async () => {
        mockedUpdateBulkCriticality.mockResolvedValue({ updatedCount: 2 });
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const hospitalRow = screen.getByText('Hospital A').closest('tr');
        expect(hospitalRow).toBeInTheDocument();
        if (!hospitalRow) {
            return;
        }
        fireEvent.click(hospitalRow);
        fireEvent.click(await screen.findByRole('button', { name: /edit 1 selected/i }));
        fireEvent.change(screen.getByLabelText('Criticality score'), { target: { value: '0' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.queryByText('Edit 1 item')).not.toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Hospital A').closest('tr')).toHaveTextContent('0');
        });
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /edit \d+ selected/i })).not.toBeInTheDocument();
        });

        const schoolRow = screen.getByText('School B').closest('tr');
        expect(schoolRow).toBeInTheDocument();
        if (!schoolRow) {
            return;
        }
        fireEvent.click(schoolRow);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /edit 1 selected/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole('button', { name: /edit 1 selected/i }));
        fireEvent.change(screen.getByLabelText('Criticality score'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.getByText('School B').closest('tr')).toHaveTextContent('2');
        });

        await waitFor(
            () => {
                expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
            },
            { timeout: 10000 },
        );
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        await screen.findByText('Save 2 items');
        fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));

        await waitFor(() => {
            expect(mockedUpdateBulkCriticality).toHaveBeenCalledWith('flood-newport', {
                updates: expect.arrayContaining([
                    { assetId: 'asset-1', criticalityScore: 0 },
                    { assetId: 'asset-2', criticalityScore: 2 },
                ]),
            });
        });
    });

    it('shows error snackbar on save failure and keeps pending edits', async () => {
        mockedUpdateBulkCriticality.mockRejectedValue(new Error('Save failed'));
        renderWithAppProviders(['/data-room/scenarios/flood-newport/edit']);
        await screen.findByText('Hospital A');

        const hospitalRow = screen.getByText('Hospital A').closest('tr')!;
        fireEvent.click(hospitalRow);

        const editButton = await screen.findByRole('button', { name: /edit 1 selected/i });
        fireEvent.click(editButton);

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));
        await waitForEditDialogToClose();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await screen.findByText('Save 1 item');
        fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));

        await waitFor(() => {
            expect(screen.getByText('Save failed')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
        });
    });
});
