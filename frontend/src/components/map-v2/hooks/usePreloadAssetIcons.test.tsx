import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePreloadAssetIcons, isIconPreloaded } from './usePreloadAssetIcons';
import type { Asset } from '@/api/assets-by-type';

const mockIcon = vi.fn();
vi.mock('@fortawesome/fontawesome-svg-core', () => ({
    icon: (args: any) => mockIcon(args),
}));

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
}

function createQueryWrapper() {
    const queryClient = createQueryClient();
    const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    return Wrapper;
}

function renderHookWithAssets(assets: Asset[]) {
    const wrapper = createQueryWrapper();
    return renderHook(() => usePreloadAssetIcons(assets), { wrapper });
}

function createErrorThrowingIconMock() {
    return () => {
        throw new Error('Icon not found');
    };
}

function testIconPreloadWithError(assets: Asset[]) {
    renderHookWithAssets(assets);
}

describe('usePreloadAssetIcons', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIcon.mockReturnValue({ iconName: 'test-icon' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Icon Preloading', () => {
        it('preloads icons for unique asset types', async () => {
            const assets: Asset[] = [
                { styles: { faIcon: 'fa-solid fa-hospital' } } as Asset,
                { styles: { faIcon: 'fa-solid fa-hospital' } } as Asset,
                { styles: { faIcon: 'fa-solid fa-school' } } as Asset,
            ];

            renderHook(() => usePreloadAssetIcons(assets), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(mockIcon).toHaveBeenCalled();
            });

            expect(mockIcon).toHaveBeenCalledWith({
                prefix: 'fas',
                iconName: 'hospital',
            });
            expect(mockIcon).toHaveBeenCalledWith({
                prefix: 'fas',
                iconName: 'school',
            });
        });

        it('does not preload icons when assets array is empty', () => {
            renderHook(() => usePreloadAssetIcons([]), {
                wrapper: createQueryWrapper(),
            });

            expect(mockIcon).not.toHaveBeenCalled();
        });

        it('handles assets without faIcon in styles', () => {
            const assets: Asset[] = [{ styles: {} } as Asset];

            renderHook(() => usePreloadAssetIcons(assets), {
                wrapper: createQueryWrapper(),
            });

            expect(mockIcon).not.toHaveBeenCalled();
        });

        it('handles icon preload errors gracefully', () => {
            mockIcon.mockImplementation(createErrorThrowingIconMock());

            const assets: Asset[] = [{ styles: { faIcon: 'fa-solid fa-hospital' } } as Asset];

            expect(() => testIconPreloadWithError(assets)).not.toThrow();
        });

        it('extracts icon name correctly from faIcon string', async () => {
            const assets: Asset[] = [{ styles: { faIcon: 'fa-solid fa-hospital-building' } } as Asset];

            renderHook(() => usePreloadAssetIcons(assets), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(mockIcon).toHaveBeenCalledWith({
                    prefix: 'fas',
                    iconName: 'hospital-building',
                });
            });
        });
    });

    describe('isIconPreloaded', () => {
        beforeEach(() => {
            mockIcon.mockReturnValue({ iconName: 'test-icon' });
        });

        it('returns true for preloaded icons', async () => {
            const assets: Asset[] = [{ styles: { faIcon: 'fa-solid fa-hospital' } } as Asset];

            renderHook(() => usePreloadAssetIcons(assets), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(isIconPreloaded('hospital')).toBe(true);
            });
        });

        it('returns false for non-preloaded icons', () => {
            expect(isIconPreloaded('non-existent-icon')).toBe(false);
        });

        it('returns false for icons that failed to load', async () => {
            mockIcon.mockImplementation(createErrorThrowingIconMock());

            const assets: Asset[] = [{ styles: { faIcon: 'fa-solid fa-test-icon' } } as Asset];

            renderHook(() => usePreloadAssetIcons(assets), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(isIconPreloaded('test-icon')).toBe(false);
            });
        });
    });
});
