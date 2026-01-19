import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import FocusAreaView from './FocusAreaView';
import theme from '@/theme';
import { updateFocusArea, deleteFocusArea, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/focus-areas', () => ({
    updateFocusArea: vi.fn(),
    deleteFocusArea: vi.fn(),
}));

const mockStartDrawing = vi.fn();
const mockSetDrawingConfig = vi.fn();
vi.mock('../context/DrawingContext', () => ({
    useDrawingContext: vi.fn(() => ({
        setDrawingConfig: mockSetDrawingConfig,
        drawingMode: null,
        startDrawing: mockStartDrawing,
    })),
}));

const mockedUpdateFocusArea = vi.mocked(updateFocusArea);
const mockedDeleteFocusArea = vi.mocked(deleteFocusArea);

describe('FocusAreaView', () => {
    const mockGeometry: Geometry = {
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
    };

    const createMockFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
        id: 'focus-area-1',
        name: 'Test Focus Area',
        geometry: mockGeometry,
        filterMode: 'by_asset_type',
        isActive: true,
        isSystem: false,
        ...overrides,
    });

    const createMapWideFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
        id: 'map-wide',
        name: 'Map-wide',
        geometry: null,
        filterMode: 'by_asset_type',
        isActive: true,
        isSystem: true,
        ...overrides,
    });

    const defaultFocusAreas = [createMapWideFocusArea(), createMockFocusArea()];

    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-123',
        focusAreas: defaultFocusAreas,
        isLoading: false,
        isError: false,
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
        mockStartDrawing.mockClear();
        mockSetDrawingConfig.mockClear();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMutationMocks = () => {
        mockedUpdateFocusArea.mockImplementation(async (_scenarioId, _focusAreaId, data) => ({
            ...createMockFocusArea(),
            ...data,
        }));
        mockedDeleteFocusArea.mockResolvedValue(undefined);
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Focus area')).toBeInTheDocument();
        });
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('renders map-wide toggle', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Map-wide')).toBeInTheDocument();
            });
        });

        it('renders draw button', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading state when focus areas are loading', async () => {
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={undefined} isLoading={true} />);
            await waitFor(() => {
                expect(screen.getByText('Loading focus areas...')).toBeInTheDocument();
            });
        });

        it('hides loading state when focus areas are loaded', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.queryByText('Loading focus areas...')).not.toBeInTheDocument();
            });
        });
    });

    describe('No Scenario State', () => {
        it('shows "No scenario selected" when scenarioId is undefined', async () => {
            renderWithProviders(<FocusAreaView {...defaultProps} scenarioId={undefined} />);
            await waitFor(() => {
                expect(screen.getByText('No scenario selected')).toBeInTheDocument();
            });
        });

        it('disables draw button when no scenario is selected', async () => {
            renderWithProviders(<FocusAreaView {...defaultProps} scenarioId={undefined} />);
            await waitFor(() => {
                const drawButton = screen.getByText('Draw new focus area').closest('button');
                expect(drawButton).toBeDisabled();
            });
        });
    });

    describe('Empty State', () => {
        it('renders without focus area items when list is empty', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={[createMapWideFocusArea()]} />);
            await waitFor(() => {
                expect(screen.getByText('Focus area')).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Edit focus area name')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Delete focus area')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('shows error message when fetch fails', async () => {
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={undefined} isError={true} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading focus areas')).toBeInTheDocument();
            });
        });
    });

    describe('Focus Areas Display', () => {
        it('displays focus area names', async () => {
            setupMutationMocks();
            const focusAreas = [
                createMapWideFocusArea(),
                createMockFocusArea({ id: '1', name: 'Area One' }),
                createMockFocusArea({ id: '2', name: 'Area Two' }),
            ];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Area One')).toBeInTheDocument();
                expect(screen.getByText('Area Two')).toBeInTheDocument();
            });
        });

        it('shows visibility icon for active focus areas', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide focus area')).toBeInTheDocument();
            });
        });

        it('shows visibility off icon for inactive focus areas', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', isActive: false })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show focus area')).toBeInTheDocument();
            });
        });
    });

    describe('Map-wide Toggle', () => {
        it('shows visibility icon when map-wide is visible', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea({ isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide map-wide assets')).toBeInTheDocument();
            });
        });

        it('shows visibility off icon when map-wide is hidden', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea({ isActive: false })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show map-wide assets')).toBeInTheDocument();
            });
        });

        it('calls updateFocusArea when map-wide toggle is clicked', async () => {
            const user = userEvent.setup();
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea()];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Hide map-wide assets')).toBeInTheDocument();
            });

            await user.click(screen.getByLabelText('Hide map-wide assets'));

            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'map-wide', { isActive: false });
            });
        });
    });

    describe('Focus Area Actions', () => {
        it('toggles focus area visibility when visibility button is clicked', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Hide focus area'));
            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { isActive: false });
            });
        });

        it('deletes focus area when delete button is clicked', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Delete focus area'));
            await waitFor(() => {
                expect(screen.getByText('Delete focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));
            await waitFor(() => {
                expect(mockedDeleteFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1');
            });
        });

        it('enters edit mode when edit button is clicked', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            await waitFor(() => {
                expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
            });
        });

        it('updates focus area name on blur', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: 'New Name' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { name: 'New Name' });
            });
        });

        it('updates focus area name on Enter key', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: 'New Name' } });
            fireEvent.keyDown(input, { key: 'Enter' });
            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { name: 'New Name' });
            });
        });

        it('cancels edit on Escape key', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: 'Changed Name' } });
            fireEvent.keyDown(input, { key: 'Escape' });
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('does not update if name is unchanged', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.blur(input);
            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('shows error when name is empty on blur', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
            });
            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('shows error when name is only whitespace', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: '   ' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
            });
            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('clears error when user types after validation error', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
            });
            fireEvent.change(input, { target: { value: 'N' } });
            await waitFor(() => {
                expect(screen.queryByText('Name cannot be empty')).not.toBeInTheDocument();
            });
        });

        it('clears error when Escape is pressed', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ name: 'Original Name' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
            });
            fireEvent.keyDown(input, { key: 'Escape' });
            await waitFor(() => {
                expect(screen.queryByText('Name cannot be empty')).not.toBeInTheDocument();
            });
        });

        it('disables visibility toggle while visibility mutation is pending', async () => {
            let resolveUpdate: (value: FocusArea) => void;
            const updatePromise = new Promise<FocusArea>((resolve) => {
                resolveUpdate = resolve;
            });
            mockedUpdateFocusArea.mockReturnValue(updatePromise);

            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Test', isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Hide focus area'));

            await waitFor(() => {
                // Only the visibility toggle should be disabled during visibility mutation
                expect(screen.getByLabelText('Hide focus area')).toBeDisabled();
            });

            resolveUpdate!(createMockFocusArea({ id: 'fa-1', isActive: false }));
        });

        it('shows error snackbar when visibility update fails', async () => {
            mockedUpdateFocusArea.mockRejectedValue(new Error('Network error'));

            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Test', isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Hide focus area'));

            await waitFor(() => {
                expect(screen.getByText('Failed to update focus area')).toBeInTheDocument();
            });
        });

        it('shows error snackbar when delete fails', async () => {
            mockedDeleteFocusArea.mockRejectedValue(new Error('Network error'));

            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Test', isActive: true })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete focus area'));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'DELETE' })).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));

            await waitFor(() => {
                expect(screen.getByText('Failed to delete focus area')).toBeInTheDocument();
            });
        });
    });

    describe('Delete Confirmation Dialog', () => {
        it('opens dialog when delete button is clicked', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Test Area' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Test Area')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete focus area'));

            await waitFor(() => {
                expect(screen.getByText('Delete focus area')).toBeInTheDocument();
                expect(screen.getByText('Are you sure you want to delete "Test Area"?')).toBeInTheDocument();
            });
        });

        it('closes dialog when cancel is clicked', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: 'Test Area' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByText('Test Area')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete focus area'));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));

            await waitFor(() => {
                expect(screen.queryByText('Are you sure you want to delete "Test Area"?')).not.toBeInTheDocument();
            });
            expect(mockedDeleteFocusArea).not.toHaveBeenCalled();
        });

        it('shows fallback name for unnamed focus area', async () => {
            setupMutationMocks();
            const focusAreas = [createMapWideFocusArea(), createMockFocusArea({ id: 'fa-1', name: '' })];
            renderWithProviders(<FocusAreaView {...defaultProps} focusAreas={focusAreas} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete focus area')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete focus area'));

            await waitFor(() => {
                expect(screen.getByText('Are you sure you want to delete "Unnamed focus area"?')).toBeInTheDocument();
            });
        });
    });

    describe('Draw Menu', () => {
        it('opens draw menu when draw button is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new focus area'));
            await waitFor(() => {
                expect(screen.getByText('Draw circle')).toBeInTheDocument();
                expect(screen.getByText('Draw polygon')).toBeInTheDocument();
            });
        });

        it('calls startDrawing with "circle" when circle option is clicked', async () => {
            setupMutationMocks();
            mockStartDrawing.mockClear();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new focus area'));
            await waitFor(() => {
                expect(screen.getByText('Draw circle')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw circle'));
            expect(mockStartDrawing).toHaveBeenCalledWith('circle');
        });

        it('calls startDrawing with "polygon" when polygon option is clicked', async () => {
            setupMutationMocks();
            mockStartDrawing.mockClear();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new focus area'));
            await waitFor(() => {
                expect(screen.getByText('Draw polygon')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw polygon'));
            expect(mockStartDrawing).toHaveBeenCalledWith('polygon');
        });

        it('disables draw button when isDrawing is true', async () => {
            // Re-mock useDrawingContext to return drawingMode: 'polygon' for this test
            const { useDrawingContext } = await import('../context/DrawingContext');
            vi.mocked(useDrawingContext).mockReturnValue({
                setDrawingConfig: mockSetDrawingConfig,
                drawingMode: 'polygon',
                startDrawing: mockStartDrawing,
            } as unknown as ReturnType<typeof useDrawingContext>);

            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                const drawButton = screen.getByText('Draw new focus area').closest('button');
                expect(drawButton).toBeDisabled();
            });

            // Reset mock
            vi.mocked(useDrawingContext).mockReturnValue({
                setDrawingConfig: mockSetDrawingConfig,
                drawingMode: null,
                startDrawing: mockStartDrawing,
            } as unknown as ReturnType<typeof useDrawingContext>);
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMutationMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Close panel'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
