import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useScenarioAssets } from './useScenarioAssets';
import type { Asset } from '@/api/assets-by-type';
import { fetchScenarioAssets } from '@/api/scenario-assets';

vi.mock('@/api/scenario-assets');

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const TestWrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: createQueryClient() }, children);

const pendingPromise = () => new Promise<never>(() => {});

const mockAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: 'asset-1',
    type: 'type-1',
    name: 'Test Asset',
    lat: 51.5,
    lng: -0.1,
    geometry: { type: 'Point', coordinates: [-0.1, 51.5] },
    dependent: { count: 0, criticalitySum: 0 },
    styles: {
        classUri: 'type-1',
        color: '#DDDDDD',
        backgroundColor: '#121212',
        faIcon: 'fa-building',
        iconFallbackText: 'building',
        alt: 'Test Type',
    },
    elementType: 'asset',
    ...overrides,
});

describe('useScenarioAssets', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Query enabling', () => {
        it('does not fetch when scenarioId is undefined', () => {
            renderHook(() => useScenarioAssets({ scenarioId: undefined }), {
                wrapper: TestWrapper,
            });

            expect(fetchScenarioAssets).not.toHaveBeenCalled();
        });

        it('fetches when scenarioId is provided', async () => {
            vi.mocked(fetchScenarioAssets).mockResolvedValue([]);

            renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123' }), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(fetchScenarioAssets).toHaveBeenCalledWith({
                    scenarioId: 'scenario-123',
                    iconMap: undefined,
                });
            });
        });
    });

    describe('Data fetching', () => {
        it('returns loading state initially', () => {
            vi.mocked(fetchScenarioAssets).mockImplementation(pendingPromise);

            const { result } = renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123' }), {
                wrapper: TestWrapper,
            });

            expect(result.current.isLoading).toBe(true);
            expect(result.current.assets).toEqual([]);
        });

        it('returns assets when fetch succeeds', async () => {
            const mockAssets = [mockAsset({ id: 'asset-1', name: 'Asset 1' }), mockAsset({ id: 'asset-2', name: 'Asset 2' })];

            vi.mocked(fetchScenarioAssets).mockResolvedValue(mockAssets);

            const { result } = renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123' }), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assets).toHaveLength(2);
            expect(result.current.assets[0].name).toBe('Asset 1');
            expect(result.current.assets[1].name).toBe('Asset 2');
        });

        it('returns empty array when no assets exist', async () => {
            vi.mocked(fetchScenarioAssets).mockResolvedValue([]);

            const { result } = renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123' }), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assets).toEqual([]);
            expect(result.current.hasError).toBe(false);
        });
    });

    describe('Options', () => {
        it('passes iconMap option to fetch function', async () => {
            vi.mocked(fetchScenarioAssets).mockResolvedValue([]);
            const iconMap = new Map([['type-1', 'fa-building']]);

            renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123', iconMap }), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(fetchScenarioAssets).toHaveBeenCalledWith({
                    scenarioId: 'scenario-123',
                    iconMap,
                });
            });
        });
    });

    describe('Error handling', () => {
        it('sets error state when fetch fails', async () => {
            const error = new Error('Failed to fetch');
            vi.mocked(fetchScenarioAssets).mockRejectedValue(error);

            const { result } = renderHook(() => useScenarioAssets({ scenarioId: 'scenario-123' }), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.hasError).toBe(true);
            });

            expect(result.current.error).toBe(error);
            expect(result.current.assets).toEqual([]);
        });
    });

    describe('Query key changes', () => {
        it('refetches when scenarioId changes', async () => {
            vi.mocked(fetchScenarioAssets).mockResolvedValue([mockAsset({ name: 'Scenario 1 Asset' })]);

            const { result, rerender } = renderHook(({ scenarioId }) => useScenarioAssets({ scenarioId }), {
                wrapper: TestWrapper,
                initialProps: { scenarioId: 'scenario-1' },
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.assets[0].name).toBe('Scenario 1 Asset');

            vi.mocked(fetchScenarioAssets).mockResolvedValue([mockAsset({ name: 'Scenario 2 Asset' })]);

            rerender({ scenarioId: 'scenario-2' });

            await waitFor(() => {
                expect(result.current.assets[0].name).toBe('Scenario 2 Asset');
            });

            expect(fetchScenarioAssets).toHaveBeenCalledWith(expect.objectContaining({ scenarioId: 'scenario-2' }));
        });
    });
});
