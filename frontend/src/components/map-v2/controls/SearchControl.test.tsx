// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchControl from './SearchControl';
import { fetchAssetByExternalId, fetchAssetById } from '@/api/asset-search';
import { searchOsNamesLocations } from '@/api/os-names';
import theme from '@/theme';

vi.mock('@/api/os-names', () => ({
    searchOsNamesLocations: vi.fn(),
}));
vi.mock('@/api/asset-search', () => ({
    fetchAssetByExternalId: vi.fn(),
    fetchAssetById: vi.fn(),
}));

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('SearchControl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts at half width and semi-transparent', () => {
        renderWithTheme(<SearchControl />);

        const searchContainer = screen.getByRole('search', { name: 'Map search' });
        const searchBar = screen.getByTestId('map-search-container');
        expect(searchContainer).toHaveAttribute('data-active', 'false');
        expect(searchContainer).toHaveStyle({ width: '14rem' });
        expect(searchBar).toHaveStyle({ opacity: '0.8' });
    });

    it('expands and becomes active when clicked', () => {
        renderWithTheme(<SearchControl />);

        const searchContainer = screen.getByRole('search', { name: 'Map search' });
        const searchBar = screen.getByTestId('map-search-container');
        fireEvent.click(searchBar);

        expect(searchContainer).toHaveAttribute('data-active', 'true');
        expect(searchContainer).toHaveStyle({ width: '28rem' });
        expect(searchBar).toHaveStyle({ opacity: '0.8' });
    });

    it('collapses again on blur', () => {
        renderWithTheme(<SearchControl />);

        const searchContainer = screen.getByRole('search', { name: 'Map search' });
        const searchBar = screen.getByTestId('map-search-container');
        fireEvent.click(searchBar);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.blur(input, { relatedTarget: document.body });

        return waitFor(() => {
            expect(searchContainer).toHaveAttribute('data-active', 'false');
        });
    });

    it('calls OS Names search on Enter and shows results', async () => {
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValueOnce([{ name: 'Newport', label: 'Newport (Town)', lng: -1.3, lat: 50.7 }]);
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'newport' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(searchOsNamesLocations).toHaveBeenCalledWith('newport');
            expect(screen.getByText('Newport (Town)')).toBeInTheDocument();
        });
    });

    it('runs search after debounce delay when typing', async () => {
        vi.useFakeTimers();
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValueOnce([{ name: 'Newport', label: 'Newport (Town)', lng: -1.3, lat: 50.7 }]);
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.change(input, { target: { value: 'newport' } });

        await act(async () => {
            vi.advanceTimersByTime(699);
        });
        expect(searchOsNamesLocations).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(1);
            await Promise.resolve();
        });

        expect(searchOsNamesLocations).toHaveBeenCalledWith('newport');
    });

    it('does not auto-retry the same failed query after debounce', async () => {
        vi.useFakeTimers();
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockRejectedValue(new Error('request failed'));
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.change(input, { target: { value: 'newport' } });

        await act(async () => {
            vi.advanceTimersByTime(700);
            await Promise.resolve();
        });
        expect(searchOsNamesLocations).toHaveBeenCalledTimes(1);

        await act(async () => {
            vi.advanceTimersByTime(700);
            await Promise.resolve();
        });
        expect(searchOsNamesLocations).toHaveBeenCalledTimes(1);
    });

    it('allows searching the same query again after reactivating search', async () => {
        vi.useFakeTimers();
        vi.mocked(fetchAssetByExternalId).mockResolvedValue(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValue([]);
        renderWithTheme(<SearchControl />);

        const searchBar = screen.getByTestId('map-search-container');
        const input = screen.getByLabelText('Search map');

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'newpor' } });
        await act(async () => {
            vi.advanceTimersByTime(700);
            await Promise.resolve();
        });
        expect(searchOsNamesLocations).toHaveBeenCalledTimes(1);

        fireEvent.blur(input, { relatedTarget: document.body });
        fireEvent.click(searchBar);
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.change(input, { target: { value: 'newpor' } });
        await act(async () => {
            vi.advanceTimersByTime(700);
            await Promise.resolve();
        });

        expect(searchOsNamesLocations).toHaveBeenCalledTimes(2);
    });

    it('emits location selection when a location result is clicked', async () => {
        const onResultSelect = vi.fn();
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValueOnce([
            {
                name: 'Newport',
                label: 'Newport (Town)',
                localType: 'Town',
                lng: -1.3,
                lat: 50.7,
                bounds: [
                    [-1.32, 50.69],
                    [-1.28, 50.71],
                ],
            },
        ]);
        renderWithTheme(<SearchControl onResultSelect={onResultSelect} />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'newport' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        const option = await screen.findByRole('button', { name: /newport \(town\)/i });
        fireEvent.click(option);

        expect(onResultSelect).toHaveBeenCalledWith({
            kind: 'location',
            lng: -1.3,
            lat: 50.7,
            bounds: [
                [-1.32, 50.69],
                [-1.28, 50.71],
            ],
            localType: 'Town',
        });
    });

    it('shows no results when external asset lookup returns 404 and location search is empty', async () => {
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValueOnce([]);
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('No Results Found')).toBeInTheDocument();
        });
        expect(searchOsNamesLocations).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('shows no results when resolved internal asset lookup returns 404', async () => {
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce({
            id: 'internal-id-1',
            name: 'Test Asset',
        });
        vi.mocked(fetchAssetById).mockResolvedValueOnce(null);
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('No Results Found')).toBeInTheDocument();
        });
    });

    it('uses GUID mode and emits asset selection', async () => {
        const onResultSelect = vi.fn();
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce({
            id: 'internal-id-1',
            name: 'Test Asset',
        });
        vi.mocked(fetchAssetById).mockResolvedValueOnce({
            id: 'internal-id-1',
            externalId: 'external-id-1',
            name: 'Test Asset',
            geom: 'POINT(-1.3 50.7)',
            type: { id: 'type-1', name: 'Substation' },
            providers: [],
            dependents: [],
        });
        renderWithTheme(<SearchControl onResultSelect={onResultSelect} />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        const option = await screen.findByRole('button', { name: /test asset \(substation\)/i });
        fireEvent.click(option);
        expect(input).toHaveValue('external-id-1');

        expect(fetchAssetByExternalId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
        expect(fetchAssetById).toHaveBeenCalledWith('internal-id-1');
        expect(searchOsNamesLocations).not.toHaveBeenCalled();
        expect(onResultSelect).toHaveBeenCalledWith({
            kind: 'asset',
            asset: {
                id: 'internal-id-1',
                externalId: 'external-id-1',
                name: 'Test Asset',
                geom: 'POINT(-1.3 50.7)',
                type: { id: 'type-1', name: 'Substation' },
                providers: [],
                dependents: [],
            },
        });
    });

    it('shows no results when location search returns empty', async () => {
        vi.mocked(fetchAssetByExternalId).mockResolvedValueOnce(null);
        vi.mocked(searchOsNamesLocations).mockResolvedValueOnce([]);
        renderWithTheme(<SearchControl />);

        const input = screen.getByLabelText('Search map');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'zzzzzz' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('No Results Found')).toBeInTheDocument();
        });
    });
});
