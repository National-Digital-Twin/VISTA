import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';
import { fetchScenarios } from '@/api/scenarios';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn().mockResolvedValue([]),
}));

const mockedFetchScenarios = vi.mocked(fetchScenarios);

const mockScenarios = [
    { id: 'flood-newport', name: 'Flood in Newport', isActive: true, code: 'F001' },
    { id: 'landslide-ventnor', name: 'Landslide in Ventnor', isActive: false, code: 'L001' },
    { id: 'wildfire-shanklin', name: 'Wildfire in Shanklin', isActive: false, code: 'W001' },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchScenarios.mockResolvedValue(mockScenarios);
    mockUseUserData.mockReturnValue({
        getUserDisplayName: () => 'Name',
        getUserEmailDomain: () => 'Email',
        getUserType: () => 'Admin',
        isAdmin: true,
    });
});

describe('ManageScenarios', () => {
    it('redirects non-admin users to data-room', () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'Name',
            getUserEmailDomain: () => 'Email',
            getUserType: () => 'General',
            isAdmin: false,
        });
        renderWithAppProviders(['/data-room/scenarios']);

        expect(screen.queryByText('Scenario ID')).not.toBeInTheDocument();
    });

    it('renders loading state', () => {
        mockedFetchScenarios.mockReturnValue(new Promise(() => {}));
        renderWithAppProviders(['/data-room/scenarios']);

        expect(screen.getByText('Loading scenarios...')).toBeInTheDocument();
    });

    it('renders scenario table with data', async () => {
        renderWithAppProviders(['/data-room/scenarios']);

        expect(await screen.findByText('F001')).toBeInTheDocument();
        expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();

        expect(screen.getByText('L001')).toBeInTheDocument();
        expect(screen.getByText('Landslide in Ventnor')).toBeInTheDocument();
        expect(screen.getAllByText('Inactive')).toHaveLength(2);
    });

    it('renders table headers', async () => {
        renderWithAppProviders(['/data-room/scenarios']);
        await screen.findByText('F001');

        expect(screen.getByText('Scenario ID')).toBeInTheDocument();
        expect(screen.getByText('Incident type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('filters scenarios by search input', async () => {
        renderWithAppProviders(['/data-room/scenarios']);
        await screen.findByText('F001');

        const searchInput = screen.getByPlaceholderText('Search for a scenario');
        fireEvent.change(searchInput, { target: { value: 'flood' } });

        expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
        expect(screen.queryByText('Landslide in Ventnor')).not.toBeInTheDocument();
        expect(screen.queryByText('Wildfire in Shanklin')).not.toBeInTheDocument();
    });

    it('filters scenarios by code', async () => {
        renderWithAppProviders(['/data-room/scenarios']);
        await screen.findByText('F001');

        const searchInput = screen.getByPlaceholderText('Search for a scenario');
        fireEvent.change(searchInput, { target: { value: 'L001' } });

        expect(screen.getByText('Landslide in Ventnor')).toBeInTheDocument();
        expect(screen.queryByText('Flood in Newport')).not.toBeInTheDocument();
    });

    it('shows empty state when no scenarios match search', async () => {
        renderWithAppProviders(['/data-room/scenarios']);
        await screen.findByText('F001');

        const searchInput = screen.getByPlaceholderText('Search for a scenario');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

        expect(screen.getByText('No scenarios found.')).toBeInTheDocument();
    });

    it('navigates to scenario detail on row click', async () => {
        renderWithAppProviders(['/data-room/scenarios']);

        const cell = await screen.findByText('Flood in Newport');
        const row = cell.closest('tr');
        expect(row).not.toBeNull();
        if (row) {
            fireEvent.click(row);

            await waitFor(() => {
                expect(screen.queryByText('Scenario ID')).not.toBeInTheDocument();
            });
        }
    });

    it('displays error snackbar on fetch error', async () => {
        mockedFetchScenarios.mockRejectedValue(new Error('Network error'));
        renderWithAppProviders(['/data-room/scenarios']);

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });
});
