import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useFloodMonitoringStations from './useFloodMonitoringStations';
import * as combinedApi from '@/api/combined';
import { ElementsContext } from '@/context/ElementContext';

vi.mock('@/api/combined');

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const mockContext = {
        updateErrorNotifications: vi.fn(),
        dismissErrorNotification: vi.fn(),
    };

    function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(ElementsContext.Provider, { value: mockContext as any }, children),
        );
    }
    return Wrapper;
}

describe('useFloodMonitoringStations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Menu item', () => {
        it('returns menu item configuration', () => {
            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            expect(result.current.menuItem).toMatchObject({
                name: 'Monitoring Stations',
                selected: false,
                type: 'toggleSwitch',
            });
            expect(result.current.menuItem.onItemClick).toBeTypeOf('function');
        });

        it('toggles showStations when menu item clicked', () => {
            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            expect(result.current.showStations).toBe(false);

            act(() => {
                result.current.menuItem.onItemClick();
            });

            expect(result.current.showStations).toBe(true);
            expect(result.current.menuItem.selected).toBe(true);
        });

        it('menu item selected state reflects showStations', () => {
            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            expect(result.current.menuItem.selected).toBe(false);

            act(() => {
                result.current.menuItem.onItemClick();
            });

            expect(result.current.menuItem.selected).toBe(true);

            act(() => {
                result.current.menuItem.onItemClick();
            });

            expect(result.current.menuItem.selected).toBe(false);
        });
    });

    describe('Data fetching', () => {
        it('does not fetch when showStations is false', async () => {
            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.showStations).toBe(false);
            });

            expect(combinedApi.fetchFloodMonitoringStations).not.toHaveBeenCalled();
        });

        it('fetches stations when showStations is true', async () => {
            const mockData = {
                items: [
                    {
                        '@id': 'station-1',
                        'label': 'Station 1',
                        'lat': 50.7,
                        'long': -1.35,
                    },
                ],
            };

            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockResolvedValue(mockData);

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(combinedApi.fetchFloodMonitoringStations).toHaveBeenCalled();
            });
        });

        it('transforms stations to GeoJSON features', async () => {
            const mockData = {
                items: [
                    {
                        '@id': 'http://example.com/station#1',
                        'label': 'Test Station',
                        'lat': 50.7,
                        'long': -1.35,
                    },
                ],
            };

            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockResolvedValue(mockData);

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(result.current.query.data).toBeDefined();
            });

            expect(result.current.query.data).toEqual([
                {
                    type: 'Feature',
                    properties: {
                        id: 'http://example.com/station#1',
                        label: 'Test Station',
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [-1.35, 50.7],
                    },
                },
            ]);
        });

        it('transforms multiple stations', async () => {
            const mockData = {
                items: [
                    { '@id': 'station-1', 'label': 'Station 1', 'lat': 50.7, 'long': -1.35 },
                    { '@id': 'station-2', 'label': 'Station 2', 'lat': 50.8, 'long': -1.4 },
                    { '@id': 'station-3', 'label': 'Station 3', 'lat': 50.9, 'long': -1.45 },
                ],
            };

            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockResolvedValue(mockData);

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(result.current.query.data).toBeDefined();
            });

            expect(result.current.query.data).toHaveLength(3);
            expect(result.current.query.data?.[0].properties.id).toBe('station-1');
            expect(result.current.query.data?.[1].properties.id).toBe('station-2');
        });

        it('handles empty stations list', async () => {
            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockResolvedValue({ items: [] });

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(result.current.query.data).toEqual([]);
            });
        });
    });

    describe('Error handling', () => {
        it('handles fetch error', async () => {
            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockRejectedValue(new Error('API error'));

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(result.current.query.isError).toBe(true);
            });
        });
    });

    describe('Loading states', () => {
        it('shows loading while fetching', async () => {
            vi.mocked(combinedApi.fetchFloodMonitoringStations).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 100)),
            );

            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.menuItem.onItemClick();
            });

            await waitFor(() => {
                expect(result.current.query.isLoading).toBe(true);
            });

            await waitFor(() => {
                expect(result.current.query.isLoading).toBe(false);
            });
        });
    });

    describe('Toggle behavior', () => {
        it('can toggle stations on and off multiple times', () => {
            const { result } = renderHook(() => useFloodMonitoringStations(), {
                wrapper: createWrapper(),
            });

            expect(result.current.showStations).toBe(false);

            act(() => {
                result.current.menuItem.onItemClick();
            });
            expect(result.current.showStations).toBe(true);

            act(() => {
                result.current.menuItem.onItemClick();
            });
            expect(result.current.showStations).toBe(false);

            act(() => {
                result.current.menuItem.onItemClick();
            });
            expect(result.current.showStations).toBe(true);
        });
    });
});
