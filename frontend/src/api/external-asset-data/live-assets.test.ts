import type { Feature, Point } from 'geojson';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLiveAssets } from './live-assets';
import { handlerRegistry } from './handler-registry';
import type { AssetSpecification } from '@/hooks/queries/dataset-utils';

vi.mock('./handler-registry');

const delay = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });

describe('fetchLiveAssets', () => {
    const mockBuildUrls = vi.fn();
    const mockFetchData = vi.fn();

    const mockHandler = {
        buildUrlsForDataSource: mockBuildUrls,
        fetchDataForAssetSpecification: mockFetchData,
    };

    const mockSource = 'test_source';

    const createFeature = (id: number, coords: [number, number] = [0, 0]): Feature<Point> => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: { id },
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (handlerRegistry as any)[mockSource] = mockHandler;
    });

    describe('Basic Functionality', () => {
        it('fetches data from single URL', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const url = 'https://example.com/data';
            mockBuildUrls.mockReturnValue([url]);

            const features = [createFeature(1), createFeature(2)];
            mockFetchData.mockResolvedValue(features);

            const result = await fetchLiveAssets(assetSpec);

            expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);
            expect(mockFetchData).toHaveBeenCalledWith(assetSpec, url);
            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toEqual(features);
        });

        it('fetches data from multiple URLs and combines features', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'];
            mockBuildUrls.mockReturnValue(urls);

            const features1 = [createFeature(1)];
            const features2 = [createFeature(2), createFeature(3)];
            const features3 = [createFeature(4)];

            mockFetchData.mockImplementation(async (_spec, url) => {
                if (url === urls[0]) {
                    return features1;
                }
                if (url === urls[1]) {
                    return features2;
                }
                if (url === urls[2]) {
                    return features3;
                }
                return [];
            });

            const result = await fetchLiveAssets(assetSpec);

            expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);
            expect(mockFetchData).toHaveBeenCalledTimes(3);
            expect(result.features).toEqual([...features1, ...features2, ...features3]);
        });

        it('fetches all URLs in parallel', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            mockBuildUrls.mockReturnValue(urls);

            const callOrder: string[] = [];
            const delayedFetch = async (_spec: any, url: string) => {
                callOrder.push(url);
                await delay(10);
                return [createFeature(1)];
            };
            mockFetchData.mockImplementation(delayedFetch);

            await fetchLiveAssets(assetSpec);

            expect(callOrder).toHaveLength(2);
            expect(mockFetchData).toHaveBeenCalledTimes(2);
        });
    });

    describe('Empty and Edge Cases', () => {
        it('returns empty features when no URLs provided', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            mockBuildUrls.mockReturnValue([]);

            const result = await fetchLiveAssets(assetSpec);

            expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);
            expect(mockFetchData).not.toHaveBeenCalled();
            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toEqual([]);
        });

        it('handles empty feature arrays from URLs', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            mockBuildUrls.mockReturnValue(urls);
            mockFetchData.mockResolvedValue([]);

            const result = await fetchLiveAssets(assetSpec);

            expect(mockFetchData).toHaveBeenCalledTimes(2);
            expect(result.features).toEqual([]);
        });

        it('combines features when some URLs return empty arrays', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'];
            mockBuildUrls.mockReturnValue(urls);

            const features = [createFeature(1), createFeature(2)];
            mockFetchData.mockImplementation(async (_spec, url) => {
                if (url === urls[1]) {
                    return features;
                }
                return [];
            });

            const result = await fetchLiveAssets(assetSpec);

            expect(result.features).toEqual(features);
        });
    });

    describe('Error Handling', () => {
        it('throws error when handler not found', async () => {
            const assetSpec: AssetSpecification = {
                source: 'non_existent_source',
            } as any;

            await expect(fetchLiveAssets(assetSpec)).rejects.toThrow();
        });

        it('propagates fetch errors', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            mockBuildUrls.mockReturnValue(['https://example.com/data']);
            mockFetchData.mockRejectedValue(new Error('Network error'));

            await expect(fetchLiveAssets(assetSpec)).rejects.toThrow('Network error');
        });

        it('fails if any URL fetch fails', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            mockBuildUrls.mockReturnValue(urls);

            mockFetchData.mockImplementation(async (_spec, url) => {
                if (url === urls[0]) {
                    return [createFeature(1)];
                }
                throw new Error('Failed to fetch second URL');
            });

            await expect(fetchLiveAssets(assetSpec)).rejects.toThrow('Failed to fetch second URL');
        });
    });

    describe('Feature Flattening', () => {
        it('flattens nested arrays of features', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            mockBuildUrls.mockReturnValue(urls);

            const features1 = [createFeature(1), createFeature(2)];
            const features2 = [createFeature(3), createFeature(4), createFeature(5)];

            mockFetchData.mockResolvedValueOnce(features1).mockResolvedValueOnce(features2);

            const result = await fetchLiveAssets(assetSpec);

            expect(result.features).toHaveLength(5);
            expect(result.features).toEqual([...features1, ...features2]);
        });

        it('preserves feature order from URLs', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            mockBuildUrls.mockReturnValue(urls);

            const features1 = [createFeature(10), createFeature(20)];
            const features2 = [createFeature(5), createFeature(15)];

            mockFetchData.mockImplementation(async (_spec, url) => {
                if (url === urls[0]) {
                    return features1;
                }
                return features2;
            });

            const result = await fetchLiveAssets(assetSpec);

            expect(result.features[0].properties?.id).toBe(10);
            expect(result.features[1].properties?.id).toBe(20);
            expect(result.features[2].properties?.id).toBe(5);
            expect(result.features[3].properties?.id).toBe(15);
        });
    });

    describe('Asset Specification Handling', () => {
        it('passes complete asset specification to handler', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
                filters: [{ filterName: 'type', filterValue: 'test' }],
                collection: 'test-collection',
                description: ['test-desc'],
            } as any;

            mockBuildUrls.mockReturnValue(['https://example.com/data']);
            mockFetchData.mockResolvedValue([createFeature(1)]);

            await fetchLiveAssets(assetSpec);

            expect(mockBuildUrls).toHaveBeenCalledWith(assetSpec);
            expect(mockFetchData).toHaveBeenCalledWith(assetSpec, 'https://example.com/data');
        });

        it('handles asset specification with minimal properties', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            mockBuildUrls.mockReturnValue(['https://example.com/data']);
            mockFetchData.mockResolvedValue([createFeature(1)]);

            const result = await fetchLiveAssets(assetSpec);

            expect(result.type).toBe('FeatureCollection');
            expect(result.features).toHaveLength(1);
        });
    });

    describe('Return Value Structure', () => {
        it('always returns a valid FeatureCollection structure', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            mockBuildUrls.mockReturnValue([]);

            const result = await fetchLiveAssets(assetSpec);

            expect(result).toHaveProperty('type', 'FeatureCollection');
            expect(result).toHaveProperty('features');
            expect(Array.isArray(result.features)).toBe(true);
        });

        it('preserves feature geometry and properties', async () => {
            const assetSpec: AssetSpecification = {
                source: mockSource,
            } as any;

            mockBuildUrls.mockReturnValue(['https://example.com/data']);

            const feature: Feature<Point> = {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [1.5, 2.5] },
                properties: { name: 'Test', value: 42 },
            };

            mockFetchData.mockResolvedValue([feature]);

            const result = await fetchLiveAssets(assetSpec);

            expect(result.features[0]).toEqual(feature);
            expect(result.features[0].geometry.coordinates).toEqual([1.5, 2.5]);
            expect(result.features[0].properties).toEqual({ name: 'Test', value: 42 });
        });
    });
});
