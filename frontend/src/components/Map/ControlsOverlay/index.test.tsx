import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ControlsOverlay from '.';

vi.mock('@/api/apollo-client', () => ({
    default: {},
    GET_ROAD_ROUTE: {},
    GET_LOW_BRIDGES: {},
}));

const createWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('ControlsOverlay', () => {
    it('renders ControlPanel, MapToolbar, and DetailPanels', () => {
        render(<ControlsOverlay />, { wrapper: createWrapper });

        expect(screen.getByText('Layers')).toBeInTheDocument();
        expect(screen.getByText('Asset Details')).toBeInTheDocument();

        expect(screen.getByLabelText('Search for layers...')).toBeInTheDocument();

        expect(screen.getByLabelText('close layer panel')).toBeInTheDocument();
    });
});
