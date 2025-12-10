import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useDataSources } from './useDataSources';
import { fetchDataSources, type DataSource } from '@/api/datasources';

vi.mock('@/api/datasources');

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

describe('useDataSources', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Data fetching', () => {
        it('returns loading state initially', () => {
            vi.mocked(fetchDataSources).mockImplementation(pendingPromise);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            expect(result.current.isLoading).toBe(true);
            expect(result.current.dataSources).toBeUndefined();
        });

        it('returns data sources when loaded', async () => {
            const mockDataSources: DataSource[] = [
                { id: 'ds-1', name: 'OS Names', assetCount: 100, lastUpdated: '2025-01-15T10:00:00Z', owner: 'owner-1' },
                { id: 'ds-2', name: 'CQC', assetCount: 50, lastUpdated: '2025-01-10T14:30:00Z', owner: 'owner-2' },
            ];

            vi.mocked(fetchDataSources).mockResolvedValue(mockDataSources);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.dataSources).toEqual(mockDataSources);
            expect(result.current.isError).toBe(false);
        });

        it('returns error state when fetch fails', async () => {
            vi.mocked(fetchDataSources).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.dataSources).toBeUndefined();
        });
    });

    describe('dataSourceMap', () => {
        it('returns empty map when data sources are not loaded', () => {
            vi.mocked(fetchDataSources).mockImplementation(pendingPromise);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            expect(result.current.dataSourceMap.size).toBe(0);
        });

        it('returns map with data sources by ID', async () => {
            const mockDataSources: DataSource[] = [
                { id: 'ds-1', name: 'OS Names', assetCount: 100, lastUpdated: '2025-01-15T10:00:00Z', owner: 'owner-1' },
                { id: 'ds-2', name: 'CQC', assetCount: 50, lastUpdated: '2025-01-10T14:30:00Z', owner: 'owner-2' },
            ];

            vi.mocked(fetchDataSources).mockResolvedValue(mockDataSources);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.dataSourceMap.size).toBe(2);
            expect(result.current.dataSourceMap.get('ds-1')).toEqual(mockDataSources[0]);
            expect(result.current.dataSourceMap.get('ds-2')).toEqual(mockDataSources[1]);
        });

        it('allows looking up data source by ID', async () => {
            const mockDataSources: DataSource[] = [{ id: 'ds-1', name: 'OS Names', assetCount: 100, lastUpdated: '2025-01-15T10:00:00Z', owner: 'owner-1' }];

            vi.mocked(fetchDataSources).mockResolvedValue(mockDataSources);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const dataSource = result.current.dataSourceMap.get('ds-1');
            expect(dataSource?.name).toBe('OS Names');
            expect(dataSource?.lastUpdated).toBe('2025-01-15T10:00:00Z');
        });

        it('returns undefined for non-existent ID', async () => {
            const mockDataSources: DataSource[] = [{ id: 'ds-1', name: 'OS Names', assetCount: 100, lastUpdated: '2025-01-15T10:00:00Z', owner: 'owner-1' }];

            vi.mocked(fetchDataSources).mockResolvedValue(mockDataSources);

            const { result } = renderHook(() => useDataSources(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.dataSourceMap.get('non-existent')).toBeUndefined();
        });
    });
});
