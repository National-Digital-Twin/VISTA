import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FloodWarningsPanel from './FloodWarningsPanel';
import { renderWithProviders, waitForQuery } from '@/test-utils/test-helpers';

vi.mock('@/api/hydrology', () => ({
    fetchAllLiveStations: vi.fn(),
}));

describe('FloodWarningsPanel', () => {
    describe('Rendering', () => {
        it('does not render when open is false', () => {
            const { container } = renderWithProviders(<FloodWarningsPanel open={false} />);

            expect(container.firstChild).toBeNull();
        });

        it('renders when open is true', () => {
            renderWithProviders(<FloodWarningsPanel open={true} />);

            expect(screen.getByText('Flood Warnings')).toBeInTheDocument();
        });

        it('displays message when no flood warnings', async () => {
            const { fetchAllLiveStations } = await import('@/api/hydrology');
            vi.mocked(fetchAllLiveStations).mockResolvedValue({
                features: [],
            } as any);

            renderWithProviders(<FloodWarningsPanel open={true} />);

            await waitForQuery();

            expect(screen.getByText('No current flood warnings')).toBeInTheDocument();
        });

        it('displays count when flood warnings exist', async () => {
            const { fetchAllLiveStations } = await import('@/api/hydrology');
            vi.mocked(fetchAllLiveStations).mockResolvedValue({
                features: [
                    { properties: { atrisk: true, name: 'Station 1' } },
                    { properties: { atrisk: false } },
                    { properties: { atrisk: true, name: 'Station 2' } },
                ],
            } as any);

            renderWithProviders(<FloodWarningsPanel open={true} />);

            await waitForQuery();

            expect(screen.getByText(/Active flood warnings: 2/)).toBeInTheDocument();
        });
    });

    describe('Flood Warning Details', () => {
        it('displays flood warning station details', async () => {
            const { fetchAllLiveStations } = await import('@/api/hydrology');
            const mockDate = '2024-01-01T12:00:00Z';
            vi.mocked(fetchAllLiveStations).mockResolvedValue({
                features: [
                    {
                        properties: {
                            atrisk: true,
                            name: 'Test Station',
                            river: 'Test River',
                            value: 1.5,
                            trend: 'rising',
                            direction: 'u',
                            value_date: mockDate,
                            percentile_5: 0.5,
                            percentile_95: 2,
                        },
                    },
                ],
            } as any);

            renderWithProviders(<FloodWarningsPanel open={true} />);

            await waitForQuery();

            expect(screen.getByText('Test Station')).toBeInTheDocument();
            expect(screen.getByText(/River: Test River/)).toBeInTheDocument();
            expect(screen.getByText(/Current Level: 1.50m/)).toBeInTheDocument();
            expect(screen.getByText(/Trend: rising/)).toBeInTheDocument();
        });
    });
});
