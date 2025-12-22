import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DataRoom from './DataRoom';
import { fetchDataSources } from '@/api/datasources';
import { fetchScenarios } from '@/api/scenarios';

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

const mockedFetchDataSources = vi.mocked(fetchDataSources);
const mockedFetchScenarios = vi.mocked(fetchScenarios);

const createWrapper = (initialEntries: string[] = ['/data-room']) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={initialEntries}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </MemoryRouter>
    );
};

const setup = (initialEntries: string[] = ['/data-room']) => {
    const Wrapper = createWrapper(initialEntries);
    return render(
        <Wrapper>
            <DataRoom />
        </Wrapper>,
    );
};

const mockDataSources = [
    {
        id: 'cqc',
        name: 'CQC API',
        assetCount: 63,
        lastUpdated: '2025-07-20T11:04:00Z',
        owner: 'John Doe',
    },
    {
        id: 'nhs',
        name: 'NHS Open Data Portal',
        assetCount: 27,
        lastUpdated: '2025-07-21T09:31:00Z',
        owner: 'Jane Smith',
    },
    {
        id: 'os-names',
        name: 'OS Names',
        assetCount: 119,
        lastUpdated: null,
        owner: 'Bob Johnson',
    },
];

const mockScenarios = [
    {
        id: 'flood-newport',
        name: 'Flood in Newport',
        isActive: true,
    },
    {
        id: 'landslide-ventnor',
        name: 'Landslide in Ventnor',
        isActive: true,
    },
    {
        id: 'wildfire-shanklin',
        name: 'Wildfire in Shanklin',
        isActive: true,
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchDataSources.mockResolvedValue(mockDataSources);
    mockedFetchScenarios.mockResolvedValue(mockScenarios);
    mockUseUserData.mockReturnValue({
        getUserType: () => 'Admin',
    });

    sessionStorage.clear();
});

describe('DataRoom', () => {
    it('renders table headers and data', async () => {
        setup();

        expect(await screen.findByPlaceholderText('Search for a data source')).toBeInTheDocument();
        await screen.findByText('CQC API');
        expect(screen.getByText('Data source')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('# of assets')).toBeInTheDocument();
        expect(screen.getByText('Last updated')).toBeInTheDocument();

        const cqcRow = screen.getByText('CQC API').closest('tr');
        expect(cqcRow).not.toBeNull();
        if (cqcRow) {
            const { getByText, queryByText } = within(cqcRow);
            expect(getByText('John Doe')).toBeInTheDocument();
            expect(getByText('63')).toBeInTheDocument();
            expect(queryByText('—')).not.toBeInTheDocument();
        }
    });

    it('filters data sources based on search input', async () => {
        setup();

        const searchInput = await screen.findByPlaceholderText('Search for a data source');
        await screen.findByText('CQC API');
        fireEvent.change(searchInput, { target: { value: 'nhs' } });

        const rows = screen.getAllByRole('row');
        const dataRows = rows.slice(1); // exclude header row

        expect(dataRows).toHaveLength(1);
        expect(within(dataRows[0]).getByText('NHS Open Data Portal')).toBeInTheDocument();
    });

    it('clears search filters when Clear Filters is clicked', async () => {
        setup();

        const searchInput = await screen.findByPlaceholderText('Search for a data source');
        await screen.findByText('CQC API');
        fireEvent.change(searchInput, { target: { value: 'nhs' } });

        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        fireEvent.click(clearButton);

        const rows = await screen.findAllByRole('row');
        const dataRows = rows.slice(1);
        expect(dataRows).toHaveLength(mockDataSources.length);
    });

    it('does not render load scenario for non-admin user', async () => {
        mockUseUserData.mockReturnValue({
            getUserType: () => 'General',
        });
        setup();
        const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
        fireEvent.click(loadScenarioButton);

        const modalHeader = screen.queryByText('Choose scenario');
        expect(modalHeader).not.toBeInTheDocument();
    });

    describe('Scenario Modal', () => {
        it('does not show modal by default', async () => {
            setup();
            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });

        it('opens modal when Load scenario button is clicked', async () => {
            setup();
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
            expect(screen.getByText('Landslide in Ventnor')).toBeInTheDocument();
            expect(screen.getByText('Wildfire in Shanklin')).toBeInTheDocument();
        });

        it('has "Flood in Newport" selected by default', async () => {
            setup();
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const floodOption = screen.getByRole('radio', { name: /flood in newport/i });
            expect(floodOption).toBeChecked();
        });

        it('loads scenario from sessionStorage on mount', async () => {
            sessionStorage.setItem('selectedScenario', 'wildfire-shanklin');
            setup();
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const wildfireOption = screen.getByRole('radio', { name: /wildfire in shanklin/i });
            expect(wildfireOption).toBeChecked();
        });

        it('allows selecting different scenarios', async () => {
            setup();
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const landslideOption = screen.getByRole('radio', { name: /landslide in ventnor/i });
            fireEvent.click(landslideOption);

            expect(landslideOption).toBeChecked();
            expect(screen.getByRole('radio', { name: /flood in newport/i })).not.toBeChecked();
        });

        it('closes modal when CANCEL button is clicked', async () => {
            setup();
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
            setup();
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
            setup();
            await screen.findByText('CQC API');

            const loadScenarioButton = screen.getByRole('button', { name: /load scenario/i });
            fireEvent.click(loadScenarioButton);

            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            expect(sessionStorage.getItem('selectedScenario')).toBe('flood-newport');
        });

        it('closes modal after confirming scenario selection', async () => {
            setup();
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
            setup(['/data-room?openScenarioModal=true']);

            await waitFor(() => {
                expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            });
        });

        it('removes openScenarioModal query parameter after opening modal', async () => {
            setup(['/data-room?openScenarioModal=true']);

            await waitFor(() => {
                expect(screen.getByText('Choose scenario')).toBeInTheDocument();
            });

            await waitFor(() => {
                const url = globalThis.location.href;
                expect(url).not.toContain('openScenarioModal');
            });
        });

        it('does not open modal when query parameter is not present', async () => {
            setup(['/data-room']);

            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });

        it('does not open modal when query parameter is false', async () => {
            setup(['/data-room?openScenarioModal=false']);

            await screen.findByText('CQC API');

            expect(screen.queryByText('Choose scenario')).not.toBeInTheDocument();
        });
    });
});
