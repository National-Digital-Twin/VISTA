import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchScenarios } from '@/api/scenarios';
import { renderWithAppProviders } from '@/tests/renderWithAppProviders';

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/scenarios', () => ({
    fetchScenarios: vi.fn(),
}));

const mockFetchDataroomExposureLayers = vi.fn();
vi.mock('@/api/exposure-layers', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/exposure-layers')>();
    return {
        ...actual,
        fetchDataroomExposureLayers: (...args: unknown[]) => mockFetchDataroomExposureLayers(...args),
    };
});

vi.mock('@/api/datasources', () => ({
    fetchDataSources: vi.fn().mockResolvedValue([]),
}));

const mockDataroomMapProps = vi.fn();
vi.mock('@/components/DataroomMap', () => ({
    default: (props: Record<string, unknown>) => {
        mockDataroomMapProps(props);
        return <div data-testid="dataroom-map">Map</div>;
    },
}));

function getExposureLayersChildProps(): { layers: unknown; highlightedLayerId: string | null } | null {
    const lastCall = mockDataroomMapProps.mock.calls[mockDataroomMapProps.mock.calls.length - 1]?.[0] as Record<string, unknown> | undefined;
    const child = lastCall?.children;
    if (child && typeof child === 'object' && child !== null && 'props' in child) {
        const props = (child as { props: { layers?: unknown; highlightedLayerId?: string | null } }).props;
        return {
            layers: props.layers ?? null,
            highlightedLayerId: props.highlightedLayerId ?? null,
        };
    }
    return null;
}

const mockedFetchScenarios = vi.mocked(fetchScenarios);

const mockScenarios = [
    { id: 'flood-newport', name: 'Flood in Newport', isActive: true, code: 'F001' },
    { id: 'landslide-ventnor', name: 'Landslide in Ventnor', isActive: false, code: 'L001' },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchScenarios.mockResolvedValue(mockScenarios);
    mockFetchDataroomExposureLayers.mockResolvedValue([]);
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

    it('renders Requests table when there are pending exposure layers', async () => {
        const pendingLayer = {
            id: 'layer-pending-1',
            name: 'Pending Exposure',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
            user: { id: 'u1', name: 'Dev User' },
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        await screen.findByText('F001');
        expect(screen.getByText('Requests')).toBeInTheDocument();
        expect(screen.getByText('Pending Exposure')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    it('passes exposure layers as child (PendingExposureOutlines) to DataroomMap', async () => {
        const pendingLayer = {
            id: 'layer-1',
            name: 'Pending Layer',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        await screen.findByText('F001');

        const childProps = getExposureLayersChildProps();
        expect(childProps).not.toBeNull();
        expect(childProps?.layers).toEqual([{ id: 'layer-1', geometry: pendingLayer.geometry }]);
        expect(childProps?.highlightedLayerId).toBeNull();
    });

    it('renders Available table when there are approved or data-driven layers', async () => {
        const approvedLayer = {
            id: 'layer-approved-1',
            name: 'Caul Bourne',
            status: 'approved' as const,
            isUserDefined: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([approvedLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);

        await screen.findByText('F001');
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
    });

    it('clicking a request row selects it and passes highlightedLayerId to map child', async () => {
        const pendingLayer = {
            id: 'layer-1',
            name: 'Pending Layer',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        await userEvent.click(screen.getByText('Pending Layer'));

        expect(getExposureLayersChildProps()?.highlightedLayerId).toBe('layer-1');
    });

    it('clicking the selected row again deselects it', async () => {
        const pendingLayer = {
            id: 'layer-1',
            name: 'Pending Layer',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        await userEvent.click(screen.getByText('Pending Layer'));
        expect(getExposureLayersChildProps()?.highlightedLayerId).toBe('layer-1');

        await userEvent.click(screen.getByText('Pending Layer'));
        expect(getExposureLayersChildProps()?.highlightedLayerId).toBeNull();
    });

    it('toggling off Requests visibility removes exposure layers child from map', async () => {
        const pendingLayer = {
            id: 'layer-1',
            name: 'Pending Layer',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        expect(getExposureLayersChildProps()?.layers).toEqual([{ id: 'layer-1', geometry: pendingLayer.geometry }]);

        await userEvent.click(screen.getByRole('button', { name: /hide request layers on map/i }));

        expect(getExposureLayersChildProps()).toBeNull();
    });

    it('toggling off visibility clears selection when selected row is in that table', async () => {
        const pendingLayer = {
            id: 'layer-1',
            name: 'Pending Layer',
            status: 'pending' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([pendingLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        await userEvent.click(screen.getByText('Pending Layer'));
        expect(getExposureLayersChildProps()?.highlightedLayerId).toBe('layer-1');

        await userEvent.click(screen.getByRole('button', { name: /hide request layers on map/i }));

        expect(getExposureLayersChildProps()?.highlightedLayerId ?? null).toBeNull();
    });

    it('Available visibility is off by default; toggling on passes available layers as map child', async () => {
        const approvedLayer = {
            id: 'layer-av-1',
            name: 'Caul Bourne',
            status: 'approved' as const,
            isUserDefined: true,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockFetchDataroomExposureLayers.mockResolvedValue([approvedLayer]);

        renderWithAppProviders(['/data-room/scenarios/flood-newport']);
        await screen.findByText('F001');

        expect(getExposureLayersChildProps()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: /show available layers on map/i }));

        expect(getExposureLayersChildProps()?.layers).toEqual([{ id: 'layer-av-1', geometry: approvedLayer.geometry }]);
    });
});
