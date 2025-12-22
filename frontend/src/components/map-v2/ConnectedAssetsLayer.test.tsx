import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectedAssetsLayer from './ConnectedAssetsLayer';
import { parseGeometry, getLocationFromGeometry } from '@/api/geometry-parser';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, id, data }: { children: React.ReactNode; id: string; data: any }) => (
        <div data-testid={`source-${id}`} data-features-count={data?.features?.length || 0}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

vi.mock('@/api/geometry-parser', () => ({
    parseGeometry: vi.fn(),
    getLocationFromGeometry: vi.fn(),
}));

const mockedParseGeometry = vi.mocked(parseGeometry);
const mockedGetLocationFromGeometry = vi.mocked(getLocationFromGeometry);

describe('ConnectedAssetsLayer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockSelectedAsset = (overrides = {}) => ({
        id: 'asset1',
        lat: 51.5074,
        lng: -0.1278,
        geom: 'SRID=4326;POINT (-0.1278 51.5074)',
        ...overrides,
    });

    const createMockConnectedAsset = (id: string, overrides = {}) => ({
        id,
        geom: 'SRID=4326;POINT (-0.1278 51.5074)',
        type: { name: 'Test Type' },
        ...overrides,
    });

    describe('rendering', () => {
        it('returns null when map is not ready', () => {
            const { container } = render(<ConnectedAssetsLayer selectedAsset={createMockSelectedAsset()} dependents={[]} providers={[]} mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when no assets are provided', () => {
            const { container } = render(<ConnectedAssetsLayer selectedAsset={createMockSelectedAsset()} dependents={[]} providers={[]} mapReady={true} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when selectedAsset is null', () => {
            const { container } = render(
                <ConnectedAssetsLayer selectedAsset={null} dependents={[createMockConnectedAsset('dep1')]} providers={[]} mapReady={true} />,
            );
            expect(container.firstChild).toBeNull();
        });

        it('renders dependent assets when provided', () => {
            const mockGeometry = {
                type: 'Point' as const,
                coordinates: [-0.1278, 51.5074],
            };
            mockedParseGeometry.mockReturnValue(mockGeometry);
            mockedGetLocationFromGeometry.mockReturnValue({ lat: 51.5074, lng: -0.1278 });

            const { getByTestId } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(getByTestId('source-connected-assets-dependent-marker-source')).toBeInTheDocument();
            expect(getByTestId('source-connected-assets-dependent-line-source')).toBeInTheDocument();
        });

        it('renders provider assets when provided', () => {
            const mockGeometry = {
                type: 'Point' as const,
                coordinates: [-0.1278, 51.5074],
            };
            mockedParseGeometry.mockReturnValue(mockGeometry);
            mockedGetLocationFromGeometry.mockReturnValue({ lat: 51.5074, lng: -0.1278 });

            const { getByTestId } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[]}
                    providers={[createMockConnectedAsset('prov1')]}
                    mapReady={true}
                />,
            );

            expect(getByTestId('source-connected-assets-provider-marker-source')).toBeInTheDocument();
            expect(getByTestId('source-connected-assets-provider-line-source')).toBeInTheDocument();
        });

        it('renders polygon layers for polygon geometries', () => {
            const mockPolygonGeometry = {
                type: 'Polygon' as const,
                coordinates: [
                    [
                        [-0.1278, 51.5074],
                        [-0.1279, 51.5074],
                        [-0.1279, 51.5075],
                        [-0.1278, 51.5075],
                        [-0.1278, 51.5074],
                    ],
                ],
            };
            mockedParseGeometry.mockReturnValue(mockPolygonGeometry);
            mockedGetLocationFromGeometry.mockReturnValue({ lat: 51.5074, lng: -0.1278 });

            const { getByTestId } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(getByTestId('source-connected-assets-dependent-polygon-source')).toBeInTheDocument();
        });

        it('uses lat/lng when geom is not available', () => {
            const mockGeometry = {
                type: 'Point' as const,
                coordinates: [-0.1278, 51.5074],
            };
            mockedParseGeometry.mockReturnValue(mockGeometry);
            mockedGetLocationFromGeometry.mockReturnValue({ lat: 51.5074, lng: -0.1278 });

            const { getByTestId } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset({ geom: undefined })}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(getByTestId('source-connected-assets-dependent-marker-source')).toBeInTheDocument();
        });

        it('handles assets with invalid geometry', () => {
            mockedParseGeometry.mockReturnValue(null);

            const { container } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(container.firstChild).toBeNull();
        });

        it('handles assets with missing location', () => {
            const mockGeometry = {
                type: 'Point' as const,
                coordinates: [-0.1278, 51.5074],
            };
            mockedParseGeometry.mockReturnValue(mockGeometry);
            mockedGetLocationFromGeometry.mockReturnValue(null);

            const { container } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(container.firstChild).toBeNull();
        });

        it('handles selected asset with missing location', () => {
            mockedParseGeometry.mockReturnValue(null);

            const { container } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset({ lat: undefined, lng: undefined, geom: undefined })}
                    dependents={[createMockConnectedAsset('dep1')]}
                    providers={[]}
                    mapReady={true}
                />,
            );

            expect(container.firstChild).toBeNull();
        });

        it('renders multiple dependent and provider assets', () => {
            const mockGeometry = {
                type: 'Point' as const,
                coordinates: [-0.1278, 51.5074],
            };
            mockedParseGeometry.mockReturnValue(mockGeometry);
            mockedGetLocationFromGeometry.mockReturnValue({ lat: 51.5074, lng: -0.1278 });

            const { getByTestId } = render(
                <ConnectedAssetsLayer
                    selectedAsset={createMockSelectedAsset()}
                    dependents={[createMockConnectedAsset('dep1'), createMockConnectedAsset('dep2')]}
                    providers={[createMockConnectedAsset('prov1'), createMockConnectedAsset('prov2')]}
                    mapReady={true}
                />,
            );

            expect(getByTestId('source-connected-assets-dependent-marker-source')).toBeInTheDocument();
            expect(getByTestId('source-connected-assets-provider-marker-source')).toBeInTheDocument();
        });
    });
});
