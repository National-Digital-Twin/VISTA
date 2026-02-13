import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';
import { fetchDataSources } from '@/api/datasources';
import { fetchScenarios } from '@/api/scenarios';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

const mockedFetchDataSources = vi.mocked(fetchDataSources);
const mockedFetchScenarios = vi.mocked(fetchScenarios);

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

const mockScenarios = [
    {
        id: 'flood-newport',
        name: 'Flood in Newport',
        isActive: true,
        code: 'F001',
    },
    {
        id: 'landslide-ventnor',
        name: 'Landslide in Ventnor',
        isActive: true,
        code: 'L001',
    },
    {
        id: 'wildfire-shanklin',
        name: 'Wildfire in Shanklin',
        isActive: true,
        code: 'W001',
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchDataSources.mockResolvedValue(mockDataSources);
    mockedFetchScenarios.mockResolvedValue(mockScenarios);
    mockUseUserData.mockReturnValue({
        getUserDisplayName: () => 'Name',
        getUserEmailDomain: () => 'Email',
        getUserType: () => 'Admin',
    });

    sessionStorage.clear();
});

describe('DataSources', () => {
    it('renders the menu', () => {
        renderWithAppProviders(['/data-room']);
        expect(screen.getByText('Scenario management')).toBeInTheDocument();
        expect(screen.getByText('Data sources and access management')).toBeInTheDocument();
    });

    it('does not render load scenario for non-admin user', async () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'Name',
            getUserEmailDomain: () => 'Email',
            getUserType: () => 'General',
        });
        renderWithAppProviders(['/data-room']);
        const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
        fireEvent.click(loadScenarioButton);

        const modalHeader = screen.queryByText('Choose scenario');
        expect(modalHeader).not.toBeInTheDocument();
    });

    describe('DataSourcesTable', () => {
        it('renders table headers and data', async () => {
            renderWithAppProviders(['/data-room']);

            expect(await screen.findByPlaceholderText('Search for a data source')).toBeInTheDocument();
            await screen.findByText('CQC API');
            expect(screen.getByText('Data source')).toBeInTheDocument();
            expect(screen.getByText('Owner')).toBeInTheDocument();
            expect(screen.getByText('# of assets')).toBeInTheDocument();
            expect(screen.getByText('Last updated')).toBeInTheDocument();
            expect(screen.getByText('Access level')).toBeInTheDocument();
            expect(screen.getByText('Group access')).toBeInTheDocument();

            const cqcRow = screen.getByText('CQC API').closest('tr');
            expect(cqcRow).not.toBeNull();
            if (cqcRow) {
                const { getByText } = within(cqcRow);
                expect(getByText('John Doe')).toBeInTheDocument();
                expect(getByText('63')).toBeInTheDocument();
                expect(getByText('Available to all')).toBeInTheDocument();
            }

            const nhsRow = screen.getByText('NHS Open Data Portal').closest('tr');
            expect(nhsRow).not.toBeNull();
            if (nhsRow) {
                const { getByText } = within(nhsRow);
                expect(getByText('Restricted access')).toBeInTheDocument();
                expect(getByText('Resilience planning')).toBeInTheDocument();
            }
        });

        it('enables and clears filters via clear filters button', async () => {
            renderWithAppProviders(['/data-room']);

            const searchInput = await screen.findByPlaceholderText('Search for a data source');
            const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i });

            expect(clearFiltersButton).toBeDisabled();

            fireEvent.change(searchInput, { target: { value: 'nhs' } });
            expect(clearFiltersButton).toBeEnabled();
            expect(await screen.findByRole('link', { name: /nhs open data portal/i })).toBeInTheDocument();
            expect(screen.queryByText('CQC API')).not.toBeInTheDocument();

            fireEvent.click(clearFiltersButton);
            expect(clearFiltersButton).toBeDisabled();
            expect(screen.getByText('CQC API')).toBeInTheDocument();
            expect(screen.getByText('NHS Open Data Portal')).toBeInTheDocument();
        });

        it('filters data sources based on search input', async () => {
            renderWithAppProviders(['/data-room']);

            const searchInput = await screen.findByPlaceholderText('Search for a data source');
            await screen.findByText('CQC API');
            fireEvent.change(searchInput, { target: { value: 'nhs' } });

            const rows = screen.getAllByRole('row');
            const dataRows = rows.slice(1); // exclude header row

            expect(dataRows).toHaveLength(1);
            expect(within(dataRows[0]).getByText('NHS Open Data Portal')).toBeInTheDocument();
        });
    });

    describe('Scenario Modal', () => {
        it('does not show modal by default', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });

        it('opens modal when Load scenario button is clicked', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
            expect(screen.getByText('Landslide in Ventnor')).toBeInTheDocument();
            expect(screen.getByText('Wildfire in Shanklin')).toBeInTheDocument();
        });

        it('has "Flood in Newport" selected by default', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const floodOption = screen.getByRole('radio', { name: /flood in newport/i });
            expect(floodOption).toBeChecked();
        });

        it('loads scenario from sessionStorage on mount', async () => {
            sessionStorage.setItem('selectedScenario', 'wildfire-shanklin');
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const wildfireOption = screen.getByRole('radio', { name: /wildfire in shanklin/i });
            expect(wildfireOption).toBeChecked();
        });

        it('allows selecting different scenarios', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const landslideOption = screen.getByRole('radio', { name: /landslide in ventnor/i });
            fireEvent.click(landslideOption);

            expect(landslideOption).toBeChecked();
            expect(screen.getByRole('radio', { name: /flood in newport/i })).not.toBeChecked();
        });

        it('closes modal when CANCEL button is clicked', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            expect(screen.getByText('Choose scenario')).toBeInTheDocument();

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                const dialog = screen.queryByRole('dialog');
                expect(dialog).not.toBeInTheDocument();
            });
        });

        it('saves selected scenario to sessionStorage when CONFIRM is clicked', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const wildfireOption = screen.getByRole('radio', { name: /wildfire in shanklin/i });
            fireEvent.click(wildfireOption);

            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            expect(sessionStorage.getItem('selectedScenario')).toBe('wildfire-shanklin');
            await waitFor(() => {
                const dialog = screen.queryByRole('dialog');
                expect(dialog).not.toBeInTheDocument();
            });
        });

        it('saves default scenario to sessionStorage when CONFIRM is clicked without changing selection', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            expect(sessionStorage.getItem('selectedScenario')).toBe('flood-newport');
        });

        it('selects active scenario when no sessionStorage exists in new session', async () => {
            mockedFetchScenarios.mockResolvedValue([
                {
                    id: 'flood-newport',
                    name: 'Flood in Newport',
                    isActive: false,
                    code: 'F001',
                },
                {
                    id: 'landslide-ventnor',
                    name: 'Landslide in Ventnor',
                    isActive: true,
                    code: 'L001',
                },
                {
                    id: 'wildfire-shanklin',
                    name: 'Wildfire in Shanklin',
                    isActive: false,
                    code: 'W001',
                },
            ]);

            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const landslideOption = screen.getByRole('radio', { name: /landslide in ventnor/i });
            expect(landslideOption).toBeChecked();
        });

        it('selects first scenario when no active scenario exists and no sessionStorage', async () => {
            mockedFetchScenarios.mockResolvedValue([
                {
                    id: 'flood-newport',
                    name: 'Flood in Newport',
                    isActive: false,
                    code: 'F001',
                },
                {
                    id: 'landslide-ventnor',
                    name: 'Landslide in Ventnor',
                    isActive: false,
                    code: 'L001',
                },
                {
                    id: 'wildfire-shanklin',
                    name: 'Wildfire in Shanklin',
                    isActive: false,
                    code: 'W001',
                },
            ]);

            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const floodOption = screen.getByRole('radio', { name: /flood in newport/i });
            expect(floodOption).toBeChecked();
        });

        it('prioritizes sessionStorage over active scenario when sessionStorage exists', async () => {
            sessionStorage.setItem('selectedScenario', 'wildfire-shanklin');
            mockedFetchScenarios.mockResolvedValue([
                {
                    id: 'flood-newport',
                    name: 'Flood in Newport',
                    isActive: true,
                    code: 'F001',
                },
                {
                    id: 'landslide-ventnor',
                    name: 'Landslide in Ventnor',
                    isActive: false,
                    code: 'L001',
                },
                {
                    id: 'wildfire-shanklin',
                    name: 'Wildfire in Shanklin',
                    isActive: false,
                    code: 'W001',
                },
            ]);

            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const wildfireOption = screen.getByRole('radio', { name: /wildfire in shanklin/i });
            expect(wildfireOption).toBeChecked();
        });

        it('uses active scenario when sessionStorage value is invalid', async () => {
            sessionStorage.setItem('selectedScenario', 'invalid-scenario-id');
            mockedFetchScenarios.mockResolvedValue([
                {
                    id: 'flood-newport',
                    name: 'Flood in Newport',
                    isActive: false,
                    code: 'F001',
                },
                {
                    id: 'landslide-ventnor',
                    name: 'Landslide in Ventnor',
                    isActive: true,
                    code: 'L001',
                },
                {
                    id: 'wildfire-shanklin',
                    name: 'Wildfire in Shanklin',
                    isActive: false,
                    code: 'W001',
                },
            ]);

            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const landslideOption = screen.getByRole('radio', { name: /landslide in ventnor/i });
            expect(landslideOption).toBeChecked();
        });

        it('closes modal after confirming scenario selection', async () => {
            renderWithAppProviders(['/data-room']);
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                const dialog = screen.queryByRole('dialog');
                expect(dialog).not.toBeInTheDocument();
            });
        });
    });

    describe('Query Parameter Handling', () => {
        it('opens scenario modal when openScenarioModal query parameter is present', async () => {
            renderWithAppProviders(['/data-room?openScenarioModal=true']);

            await waitFor(() => {
                expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            });
        });

        it('removes openScenarioModal query parameter after opening modal', async () => {
            renderWithAppProviders(['/data-room?openScenarioModal=true']);

            await waitFor(() => {
                expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            });

            await waitFor(() => {
                const url = globalThis.location.href;
                expect(url).not.toContain('openScenarioModal');
            });
        });

        it('does not open modal when query parameter is not present', async () => {
            renderWithAppProviders(['/data-room']);

            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });

        it('does not open modal when query parameter is false', async () => {
            renderWithAppProviders(['/data-room?openScenarioModal=false']);

            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });
    });
});
