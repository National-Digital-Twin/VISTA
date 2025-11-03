import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DataRoom from './DataRoom';
import { fetchDataSources } from '@/api/datasources';

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn(),
}));

const mockedFetchDataSources = fetchDataSources as vi.MockedFunction<typeof fetchDataSources>;

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </MemoryRouter>
    );
};

const setup = () => {
    const Wrapper = createWrapper();
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

beforeEach(() => {
    mockedFetchDataSources.mockResolvedValue(mockDataSources);
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
});
