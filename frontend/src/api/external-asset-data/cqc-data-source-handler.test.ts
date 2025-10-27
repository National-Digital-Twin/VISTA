import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CQCDataSourceHandler } from './cqc-data-source-handler';
import { AssetSpecification } from '@/hooks/queries/dataset-utils';

describe('CQCDataSourceHandler', () => {
    let handler: CQCDataSourceHandler;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        handler = new CQCDataSourceHandler('Isle of Wight');
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    describe('buildUrlsForDataSource', () => {
        it('returns correct URL for care homes', () => {
            const assetSpec = {} as AssetSpecification;
            const urls = handler.buildUrlsForDataSource(assetSpec);

            expect(urls).toHaveLength(1);
            expect(urls[0]).toBe('/transparent-proxy/cqc/public/v1/locations?localAuthority=Isle of Wight&careHome=Y&perPage=1000');
        });

        it('uses locator in URL', () => {
            const customHandler = new CQCDataSourceHandler('Test Authority');
            const urls = customHandler.buildUrlsForDataSource({} as AssetSpecification);

            expect(urls[0]).toContain('localAuthority=Test Authority');
        });

        it('includes care home filter', () => {
            const urls = handler.buildUrlsForDataSource({} as AssetSpecification);

            expect(urls[0]).toContain('careHome=Y');
        });

        it('sets page size to 1000', () => {
            const urls = handler.buildUrlsForDataSource({} as AssetSpecification);

            expect(urls[0]).toContain('perPage=1000');
        });
    });

    describe('fetchDataForAssetSpecification', () => {
        const mockLocationsResponse = {
            total: 2,
            page: 1,
            totalPages: 1,
            nextPageUri: null,
            locations: [
                { locationId: 'loc-1', locationName: 'Care Home 1', postalCode: 'PO30 1AA' },
                { locationId: 'loc-2', locationName: 'Care Home 2', postalCode: 'PO31 2BB' },
            ],
        };

        const mockLocationDetails = [
            {
                locationId: 'loc-1',
                name: 'Care Home 1',
                type: 'Residential care home',
                onspdLatitude: 50.7,
                onspdLongitude: -1.35,
                registrationStatus: 'Registered',
                careHome: 'Y',
                numberOfBeds: 20,
                postalCode: 'PO30 1AA',
            },
            {
                locationId: 'loc-2',
                name: 'Care Home 2',
                type: 'Nursing home',
                onspdLatitude: 50.71,
                onspdLongitude: -1.36,
                registrationStatus: 'Registered',
                careHome: 'Y',
                numberOfBeds: 30,
                postalCode: 'PO31 2BB',
            },
        ];

        it('successfully fetches and transforms care home data', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[1]),
                });

            const assetSpec = {} as AssetSpecification;
            const result = await handler.fetchDataForAssetSpecification(assetSpec, mockLocationsResponse.locations[0].locationId);

            expect(result).toHaveLength(2);
            expect(result[0].type).toBe('Feature');
            expect(result[0].id).toBe('loc-1');
            expect(result[0].geometry.type).toBe('Point');
            expect(result[0].geometry.coordinates).toEqual([-1.35, 50.7]);
        });

        it('handles pagination with multiple pages', async () => {
            const page1Response = {
                total: 3,
                page: 1,
                totalPages: 2,
                nextPageUri: '/public/v1/locations?page=2',
                locations: [{ locationId: 'loc-1', locationName: 'Home 1', postalCode: 'PO30 1AA' }],
            };

            const page2Response = {
                total: 3,
                page: 2,
                totalPages: 2,
                nextPageUri: null,
                locations: [
                    { locationId: 'loc-2', locationName: 'Home 2', postalCode: 'PO31 2BB' },
                    { locationId: 'loc-3', locationName: 'Home 3', postalCode: 'PO32 3CC' },
                ],
            };

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(page1Response),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(page2Response),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[1]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                });

            const result = await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'initial-url');

            expect(result).toHaveLength(3);
            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/cqc/public/v1/locations?page=2');
        });

        it('filters out deregistered locations', async () => {
            const deregisteredDetail = {
                ...mockLocationDetails[0],
                registrationStatus: 'Deregistered',
            };

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(deregisteredDetail),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[1]),
                });

            const result = await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('loc-2');
        });

        it('applies asset specification filters', async () => {
            const assetSpec: AssetSpecification = {
                filters: [{ filterName: 'description', filterValue: 'Nursing home' }],
            } as any;

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[1]),
                });

            const result = await handler.fetchDataForAssetSpecification(assetSpec, 'url');

            expect(result).toHaveLength(1);
            expect(result[0].properties?.description).toBe('Nursing home');
        });

        it('fetches location details for all locations', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[1]),
                });

            await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url');

            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/cqc/public/v1/locations/loc-1');
            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/cqc/public/v1/locations/loc-2');
        });

        it('maps location properties correctly', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue({
                        ...mockLocationsResponse,
                        locations: [mockLocationsResponse.locations[0]],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLocationDetails[0]),
                });

            const result = await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url');

            expect(result[0].properties).toMatchObject({
                locationId: 'loc-1',
                name: 'Care Home 1',
                description: 'Residential care home',
            });
        });

        it('handles empty locations list', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    total: 0,
                    page: 1,
                    totalPages: 0,
                    nextPageUri: null,
                    locations: [],
                }),
            });

            const result = await handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url');

            expect(result).toEqual([]);
        });

        it('throws error when location search fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            await expect(handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url')).rejects.toThrow();
        });

        it('throws error when location detail fetch fails', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue({
                        ...mockLocationsResponse,
                        locations: [mockLocationsResponse.locations[0]],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                });

            await expect(handler.fetchDataForAssetSpecification({} as AssetSpecification, 'url')).rejects.toThrow();
        });
    });
});
