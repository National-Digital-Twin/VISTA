import { screen, waitFor } from '@testing-library/react';
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

vi.mock('@/components/DataroomMap', () => ({
    default: () => <div data-testid="dataroom-map">Map</div>,
}));

const mockedFetchScenarios = vi.mocked(fetchScenarios);

const mockScenarios = [
    { id: 'flood-newport', name: 'Flood in Newport', isActive: true, code: 'F001' },
    { id: 'landslide-ventnor', name: 'Landslide in Ventnor', isActive: false, code: 'L001' },
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

describe('ManageScenario', () => {
    it('redirects non-admin users to data-room', () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'Name',
            getUserEmailDomain: () => 'Email',
            getUserType: () => 'General',
            isAdmin: false,
        });
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        expect(screen.queryByText('Flood in Newport')).not.toBeInTheDocument();
    });

    it('renders loading state', () => {
        mockedFetchScenarios.mockReturnValue(new Promise(() => {}));
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders scenario details', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        expect(await screen.findByText('F001')).toBeInTheDocument();
        expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
        expect(screen.getByTestId('dataroom-map')).toBeInTheDocument();
    });

    it('renders EDIT button', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('renders back button', async () => {
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
    });

    it('shows not found for invalid scenario id', async () => {
        renderWithAppProviders(['/data-room/scenarios/nonexistent']);

        await waitFor(() => {
            expect(screen.getByText('Scenario not found.')).toBeInTheDocument();
        });
    });

    it('shows not found when fetch fails', async () => {
        mockedFetchScenarios.mockRejectedValue(new Error('Network error'));
        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        await waitFor(() => {
            expect(screen.getByText('Scenario not found.')).toBeInTheDocument();
        });
    });
});
