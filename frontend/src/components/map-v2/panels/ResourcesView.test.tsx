import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourcesView } from './ResourcesView';
import type { ResourceType } from '@/api/resources';
import theme from '@/theme';

vi.mock('../hooks/useResourceMutations', () => ({
    default: vi.fn(() => ({
        withdrawStock: vi.fn(),
        restockLocation: vi.fn(),
        toggleVisibility: vi.fn(),
        isMutating: false,
    })),
}));

vi.mock('./ResourceUsageLog', () => ({
    default: () => null,
}));

vi.mock('@/api/resources', () => ({
    fetchResourceInterventionLocation: vi.fn(),
}));

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderWithProviders = (component: ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

const createMockResourceType = (overrides?: Partial<ResourceType>): ResourceType => ({
    id: 'type-1',
    name: 'Sandbags',
    unit: 'bags',
    isActive: true,
    locations: [
        {
            id: 'loc-1',
            name: 'Depot A',
            geometry: { type: 'Point', coordinates: [-1.5, 51] },
            currentStock: 50,
            maxCapacity: 100,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
    ],
    ...overrides,
});

describe('ResourcesView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
        isLoading: false,
        isError: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        renderWithProviders(<ResourcesView {...defaultProps} isLoading={true} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders error state', () => {
        renderWithProviders(<ResourcesView {...defaultProps} isError={true} />);

        expect(screen.getByText('Failed to load resources')).toBeInTheDocument();
    });

    it('renders resource types in accordions', () => {
        const resourceTypes = [createMockResourceType(), createMockResourceType({ id: 'type-2', name: 'Pumps', unit: 'units', locations: [] })];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByText('Sandbags (1)')).toBeInTheDocument();
        expect(screen.getByText('Pumps (0)')).toBeInTheDocument();
    });

    it('renders location names and stock info', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByText('Depot A')).toBeInTheDocument();
        expect(screen.getByText('50 / 100 bags')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();

        renderWithProviders(<ResourcesView {...defaultProps} onClose={onClose} resourceTypes={[]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onLocationSelect when location is clicked', () => {
        const onLocationSelect = vi.fn();
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} onLocationSelect={onLocationSelect} />);

        fireEvent.click(screen.getByText('Depot A'));

        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
    });

    it('renders header with title', () => {
        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={[]} />);

        expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('renders stock progress bar for locations', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
    });

    it('renders manage stock button for each location', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByLabelText('Manage stock for Depot A')).toBeInTheDocument();
    });

    it('auto-expands active resource types on initial load', async () => {
        const resourceTypes = [
            createMockResourceType({ id: 'type-1', isActive: true }),
            createMockResourceType({ id: 'type-2', name: 'Pumps', isActive: false, locations: [] }),
        ];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        await waitFor(() => {
            expect(screen.getByText('Depot A')).toBeInTheDocument();
        });
    });
});
