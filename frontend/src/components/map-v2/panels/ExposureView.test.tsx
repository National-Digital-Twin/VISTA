import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { FeatureCollection } from 'geojson';

import ExposureView from './ExposureView';
import theme from '@/theme';
import { fetchExposureLayers } from '@/api/exposure-layers';

vi.mock('@/api/exposure-layers', () => ({
    fetchExposureLayers: vi.fn(),
}));

const mockedFetchExposureLayers = vi.mocked(fetchExposureLayers);

describe('ExposureView', () => {
    const defaultProps = {
        onClose: vi.fn(),
    };

    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMocks = (options?: { exposureLayers?: FeatureCollection }) => {
        const {
            exposureLayers = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-1.4, 50.67],
                                    [-1.4, 50.68],
                                    [-1.39, 50.68],
                                    [-1.39, 50.67],
                                    [-1.4, 50.67],
                                ],
                            ],
                        },
                        properties: {
                            name: 'Caul Bourne',
                        },
                    },
                    {
                        type: 'Feature',
                        id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-1.3, 50.66],
                                    [-1.3, 50.67],
                                    [-1.29, 50.67],
                                    [-1.29, 50.66],
                                    [-1.3, 50.66],
                                ],
                            ],
                        },
                        properties: {
                            name: 'River Medina',
                        },
                    },
                ],
            },
        } = options || {};

        mockedFetchExposureLayers.mockResolvedValue(exposureLayers as FeatureCollection);
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Exposure layers')).toBeInTheDocument();
        });
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('shows loading state when layers are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchExposureLayers.mockImplementation(() => neverResolvingPromise as Promise<FeatureCollection>);
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading exposure layers...')).toBeInTheDocument();
            });
        });
    });

    describe('Exposure Layers Display', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('displays exposure layers grouped under Floods', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
        });

        it('shows layer count in group header', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods \(2\)/)).toBeInTheDocument();
            });
        });

        it('displays layer names when group is expanded', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
                expect(screen.getByText('River Medina')).toBeInTheDocument();
            });
        });

        it('sorts layers alphabetically', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods \(2\)/);
            fireEvent.click(floodsHeader);
            await waitFor(() => {
                const layerNames = screen.getAllByText(/Caul Bourne|River Medina/);
                expect(layerNames[0]).toHaveTextContent('Caul Bourne');
                expect(layerNames[1]).toHaveTextContent('River Medina');
            });
        });

        it('shows "No exposure layers found" when there are no layers', async () => {
            setupMocks({
                exposureLayers: {
                    type: 'FeatureCollection',
                    features: [],
                },
            });
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('No exposure layers found')).toBeInTheDocument();
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('expands group when clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods \(2\)/);
            fireEvent.click(floodsHeader);
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
        });

        it('collapses group when clicked again', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods \(2\)/);
            fireEvent.click(floodsHeader);
            await waitFor(() => {
                const collapseElement = floodsHeader.closest('[class*="MuiBox-root"]')?.nextElementSibling;
                const isHidden =
                    collapseElement?.getAttribute('aria-hidden') === 'true' || collapseElement?.classList.toString().includes('MuiCollapse-hidden');
                expect(isHidden).toBe(true);
            });
        });
    });

    describe('Layer Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls onExposureLayerToggle when toggle is clicked', async () => {
            const onExposureLayerToggle = vi.fn();
            renderWithProviders(<ExposureView {...defaultProps} onExposureLayerToggle={onExposureLayerToggle} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
            const switches = screen.getAllByRole('switch');
            expect(switches.length).toBeGreaterThan(0);
            const toggle = switches.find((s) => {
                const listItem = s.closest('li');
                return listItem?.textContent?.includes('Caul Bourne');
            });
            expect(toggle).toBeDefined();
            if (toggle) {
                fireEvent.click(toggle);
                expect(onExposureLayerToggle).toHaveBeenCalledWith('35a910f3-f611-4096-ac0b-0928c5612e32', true);
            }
        });

        it('reflects selected state from props', async () => {
            renderWithProviders(
                <ExposureView
                    {...defaultProps}
                    selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true, 'e34e3c22-a28f-45e5-99b5-a24b55ba875f': false }}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
                expect(screen.getByText('River Medina')).toBeInTheDocument();
            });
            const switches = screen.getAllByRole('switch') as HTMLInputElement[];
            expect(switches.length).toBe(2);
            const toggle1 = switches.find((s) => {
                const listItem = s.closest('li');
                return listItem?.textContent?.includes('Caul Bourne');
            }) as HTMLInputElement;
            const toggle2 = switches.find((s) => {
                const listItem = s.closest('li');
                return listItem?.textContent?.includes('River Medina');
            }) as HTMLInputElement;
            expect(toggle1).toBeDefined();
            expect(toggle2).toBeDefined();
            expect(toggle1.checked).toBe(true);
            expect(toggle2.checked).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            mockedFetchExposureLayers.mockRejectedValue(new Error('Network error'));
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading exposure layers')).toBeInTheDocument();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                const closeButton = screen.getByLabelText('Close panel');
                expect(closeButton).toBeInTheDocument();
            });
            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
