import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FloodWarningsButton from './FloodWarningsButton';
import { renderWithProviders, waitForQuery } from '@/test-utils/test-helpers';

vi.mock('@/api/hydrology', () => ({
    fetchAllLiveStations: vi.fn(),
}));

describe('FloodWarningsButton', () => {
    const defaultProps = {
        isOpen: false,
        onToggle: vi.fn(),
    };

    describe('Rendering', () => {
        it('renders flood warnings icon', () => {
            renderWithProviders(<FloodWarningsButton {...defaultProps} />);

            expect(screen.getByAltText('Flood warnings')).toBeInTheDocument();
        });
    });

    describe('Badge Display', () => {
        it('does not display badge when no flood warnings', async () => {
            const { fetchAllLiveStations } = await import('@/api/hydrology');
            vi.mocked(fetchAllLiveStations).mockResolvedValue({
                features: [],
            } as any);

            renderWithProviders(<FloodWarningsButton {...defaultProps} />);

            const badge = screen.queryByText('0');
            expect(badge).not.toBeInTheDocument();
        });

        it('displays badge when flood warnings exist', async () => {
            const { fetchAllLiveStations } = await import('@/api/hydrology');
            vi.mocked(fetchAllLiveStations).mockResolvedValue({
                features: [{ properties: { atrisk: true } }, { properties: { atrisk: false } }, { properties: { atrisk: true } }],
            } as any);

            renderWithProviders(<FloodWarningsButton {...defaultProps} />);

            await waitForQuery();

            const badge = screen.getByText('2');
            expect(badge).toBeInTheDocument();
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to button element', () => {
            const ref = React.createRef<HTMLButtonElement>();
            renderWithProviders(<FloodWarningsButton {...defaultProps} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        });
    });
});
