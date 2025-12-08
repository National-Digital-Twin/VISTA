import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import FocusAreaView from './FocusAreaView';
import theme from '@/theme';
import { fetchFocusAreas, updateFocusArea, deleteFocusArea, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
    updateFocusArea: vi.fn(),
    deleteFocusArea: vi.fn(),
}));

const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);
const mockedUpdateFocusArea = vi.mocked(updateFocusArea);
const mockedDeleteFocusArea = vi.mocked(deleteFocusArea);

describe('FocusAreaView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-123',
        mapWideVisible: true,
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
        isActive: true,
        geometry: mockGeometry,
        ...overrides,
    });

    const setupMocks = (options?: { focusAreas?: FocusArea[] }) => {
        const { focusAreas = [createMockFocusArea()] } = options || {};
        mockedFetchFocusAreas.mockResolvedValue(focusAreas);
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
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('renders map-wide toggle', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Map-wide')).toBeInTheDocument();
            });
        });

        it('renders draw button', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading state when focus areas are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchFocusAreas.mockImplementation(() => neverResolvingPromise as Promise<FocusArea[]>);
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading focus areas...')).toBeInTheDocument();
            });
        });

        it('hides loading state when focus areas are loaded', async () => {
            setupMocks();
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
            setupMocks({ focusAreas: [] });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Focus area')).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Edit focus area name')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Delete focus area')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('shows error message when fetch fails', async () => {
            mockedFetchFocusAreas.mockRejectedValue(new Error('Network error'));
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading focus areas')).toBeInTheDocument();
            });
        });
    });

    describe('Focus Areas Display', () => {
        it('displays focus area names', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ id: '1', name: 'Area One' }), createMockFocusArea({ id: '2', name: 'Area Two' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Area One')).toBeInTheDocument();
                expect(screen.getByText('Area Two')).toBeInTheDocument();
            });
        });

        it('shows visibility icon for active focus areas', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ isActive: true })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide focus area')).toBeInTheDocument();
            });
        });

        it('shows visibility off icon for inactive focus areas', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ isActive: false })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show focus area')).toBeInTheDocument();
            });
        });
    });

    describe('Map-wide Toggle', () => {
        it('shows visibility icon when map-wide is visible', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} mapWideVisible={true} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide map-wide assets')).toBeInTheDocument();
            });
        });

        it('shows visibility off icon when map-wide is hidden', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} mapWideVisible={false} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show map-wide assets')).toBeInTheDocument();
            });
        });

        it('calls onMapWideVisibleChange when toggle is clicked', async () => {
            const onMapWideVisibleChange = vi.fn();
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} mapWideVisible={true} onMapWideVisibleChange={onMapWideVisibleChange} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide map-wide assets')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Hide map-wide assets'));
            expect(onMapWideVisibleChange).toHaveBeenCalledWith(false);
        });
    });

    describe('Focus Area Actions', () => {
        it('toggles focus area visibility when visibility button is clicked', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', isActive: true })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Hide focus area'));
            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { isActive: false });
            });
        });

        it('deletes focus area when delete button is clicked', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            await waitFor(() => {
                expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
            });
        });

        it('updates focus area name on blur', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Original Name')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit focus area name'));
            const input = screen.getByDisplayValue('Original Name');
            fireEvent.blur(input);
            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });

        it('shows error when name is empty on blur', async () => {
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ name: 'Original Name' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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

        it('disables buttons while mutation is pending', async () => {
            let resolveUpdate: (value: FocusArea) => void;
            const updatePromise = new Promise<FocusArea>((resolve) => {
                resolveUpdate = resolve;
            });
            mockedFetchFocusAreas.mockResolvedValue([createMockFocusArea({ id: 'fa-1', name: 'Test' })]);
            mockedUpdateFocusArea.mockReturnValue(updatePromise);

            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Hide focus area'));

            await waitFor(() => {
                expect(screen.getByLabelText('Edit focus area name')).toBeDisabled();
                expect(screen.getByLabelText('Delete focus area')).toBeDisabled();
                expect(screen.getByLabelText('Hide focus area')).toBeDisabled();
            });

            resolveUpdate!(createMockFocusArea({ id: 'fa-1', isActive: false }));
        });

        it('shows error snackbar when update fails', async () => {
            mockedFetchFocusAreas.mockResolvedValue([createMockFocusArea({ id: 'fa-1', name: 'Test' })]);
            mockedUpdateFocusArea.mockRejectedValue(new Error('Network error'));

            renderWithProviders(<FocusAreaView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Hide focus area'));

            await waitFor(() => {
                expect(screen.getByText('Failed to update focus area')).toBeInTheDocument();
            });
        });

        it('shows error snackbar when delete fails', async () => {
            mockedFetchFocusAreas.mockResolvedValue([createMockFocusArea({ id: 'fa-1', name: 'Test' })]);
            mockedDeleteFocusArea.mockRejectedValue(new Error('Network error'));

            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', name: 'Test Area' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', name: 'Test Area' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks({
                focusAreas: [createMockFocusArea({ id: 'fa-1', name: '' })],
            });
            renderWithProviders(<FocusAreaView {...defaultProps} />);
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
            setupMocks();
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

        it('calls onStartDrawing with "circle" when circle option is clicked', async () => {
            const onStartDrawing = vi.fn();
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} onStartDrawing={onStartDrawing} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new focus area'));
            await waitFor(() => {
                expect(screen.getByText('Draw circle')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw circle'));
            expect(onStartDrawing).toHaveBeenCalledWith('circle');
        });

        it('calls onStartDrawing with "polygon" when polygon option is clicked', async () => {
            const onStartDrawing = vi.fn();
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} onStartDrawing={onStartDrawing} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new focus area')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new focus area'));
            await waitFor(() => {
                expect(screen.getByText('Draw polygon')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw polygon'));
            expect(onStartDrawing).toHaveBeenCalledWith('polygon');
        });

        it('disables draw button when isDrawing is true', async () => {
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} isDrawing={true} />);
            await waitFor(() => {
                const drawButton = screen.getByText('Draw new focus area').closest('button');
                expect(drawButton).toBeDisabled();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMocks();
            renderWithProviders(<FocusAreaView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Close panel'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
