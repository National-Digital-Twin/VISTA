import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import ConstraintsView from './ConstraintsView';
import theme from '@/theme';
import { updateConstraintIntervention, deleteConstraintIntervention, type ConstraintInterventionType } from '@/api/constraint-interventions';

vi.mock('@/api/constraint-interventions', () => ({
    updateConstraintIntervention: vi.fn(),
    deleteConstraintIntervention: vi.fn(),
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

const mockedUpdate = vi.mocked(updateConstraintIntervention);
const mockedDelete = vi.mocked(deleteConstraintIntervention);

describe('ConstraintsView', () => {
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

    const createMockConstraintType = (overrides?: Partial<ConstraintInterventionType>): ConstraintInterventionType => ({
        id: 'type-1',
        name: 'Road blocks',
        constraintInterventions: [
            {
                id: 'ci-1',
                name: 'Road block 1',
                geometry: mockGeometry,
                isActive: true,
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z',
            },
        ],
        ...overrides,
    });

    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-123',
        constraintTypes: [createMockConstraintType()],
        isLoading: false,
        isError: false,
    };

    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
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
        mockedUpdate.mockImplementation(async (_scenarioId, _interventionId, data) => ({
            id: 'ci-1',
            name: 'Road block 1',
            geometry: mockGeometry,
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            ...data,
        }));
        mockedDelete.mockResolvedValue(undefined);
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Constraints')).toBeInTheDocument();
            });
        });

        it('renders close button', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('renders constraint type group', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road blocks')).toBeInTheDocument();
            });
        });

        it('renders draw button', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new road block')).toBeInTheDocument();
            });
        });

        it('renders constraint intervention names', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading state', async () => {
            renderWithProviders(<ConstraintsView {...defaultProps} constraintTypes={undefined} isLoading={true} />);
            await waitFor(() => {
                expect(screen.getByText('Loading constraints...')).toBeInTheDocument();
            });
        });
    });

    describe('No Scenario State', () => {
        it('shows "No scenario selected" when scenarioId is undefined', async () => {
            renderWithProviders(<ConstraintsView {...defaultProps} scenarioId={undefined} />);
            await waitFor(() => {
                expect(screen.getByText('No scenario selected')).toBeInTheDocument();
            });
        });

        it('does not render draw button when no scenario is selected', async () => {
            renderWithProviders(<ConstraintsView {...defaultProps} scenarioId={undefined} />);
            await waitFor(() => {
                expect(screen.queryByText('Draw new road block')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error State', () => {
        it('shows error message when fetch fails', async () => {
            renderWithProviders(<ConstraintsView {...defaultProps} constraintTypes={undefined} isError={true} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading constraints')).toBeInTheDocument();
            });
        });
    });

    describe('Constraint Actions', () => {
        it('toggles constraint visibility when visibility button is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide constraint')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Hide constraint'));
            await waitFor(() => {
                expect(mockedUpdate).toHaveBeenCalledWith('scenario-123', 'ci-1', { isActive: false });
            });
        });

        it('deletes constraint when delete button is clicked and confirmed', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete constraint')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Delete constraint'));
            await waitFor(() => {
                expect(screen.getByText('Delete constraint')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));
            await waitFor(() => {
                expect(mockedDelete).toHaveBeenCalledWith('scenario-123', 'ci-1');
            });
        });

        it('enters edit mode when edit button is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit constraint name'));
            await waitFor(() => {
                expect(screen.getByDisplayValue('Road block 1')).toBeInTheDocument();
            });
        });

        it('updates constraint name on blur', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit constraint name'));
            const input = screen.getByDisplayValue('Road block 1');
            fireEvent.change(input, { target: { value: 'Custom name' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(mockedUpdate).toHaveBeenCalledWith('scenario-123', 'ci-1', { name: 'Custom name' });
            });
        });

        it('cancels edit on Escape key', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit constraint name'));
            const input = screen.getByDisplayValue('Road block 1');
            fireEvent.change(input, { target: { value: 'Changed' } });
            fireEvent.keyDown(input, { key: 'Escape' });
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it('shows error when name is empty on blur', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Road block 1')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Edit constraint name'));
            const input = screen.getByDisplayValue('Road block 1');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
            });
            expect(mockedUpdate).not.toHaveBeenCalled();
        });
    });

    describe('Delete Confirmation Dialog', () => {
        it('opens dialog when delete button is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete constraint')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Delete constraint'));
            await waitFor(() => {
                expect(screen.getByText('Are you sure you want to delete "Road block 1"?')).toBeInTheDocument();
            });
        });

        it('closes dialog when cancel is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete constraint')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Delete constraint'));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
            await waitFor(() => {
                expect(screen.queryByText('Are you sure you want to delete "Road block 1"?')).not.toBeInTheDocument();
            });
            expect(mockedDelete).not.toHaveBeenCalled();
        });
    });

    describe('Draw Menu', () => {
        it('opens draw menu when draw button is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new road block')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new road block'));
            await waitFor(() => {
                expect(screen.getByText('Draw segment')).toBeInTheDocument();
                expect(screen.getByText('Draw polygon')).toBeInTheDocument();
            });
        });

        it('calls startDrawing with "line" when segment option is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new road block')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new road block'));
            await waitFor(() => {
                expect(screen.getByText('Draw segment')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw segment'));
            expect(mockStartDrawing).toHaveBeenCalledWith('line');
        });

        it('calls startDrawing with "polygon" when polygon option is clicked', async () => {
            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Draw new road block')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw new road block'));
            await waitFor(() => {
                expect(screen.getByText('Draw polygon')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Draw polygon'));
            expect(mockStartDrawing).toHaveBeenCalledWith('polygon');
        });

        it('disables draw button when isDrawing is true', async () => {
            const { useDrawingContext } = await import('../context/DrawingContext');
            vi.mocked(useDrawingContext).mockReturnValue({
                setDrawingConfig: mockSetDrawingConfig,
                drawingMode: 'polygon',
                startDrawing: mockStartDrawing,
            } as unknown as ReturnType<typeof useDrawingContext>);

            setupMutationMocks();
            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                const drawButton = screen.getByText('Draw new road block').closest('button');
                expect(drawButton).toBeDisabled();
            });

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
            renderWithProviders(<ConstraintsView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Close panel'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        it('shows error snackbar when visibility update fails', async () => {
            mockedUpdate.mockRejectedValue(new Error('Network error'));

            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide constraint')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Hide constraint'));

            await waitFor(() => {
                expect(screen.getByText('Failed to update constraint')).toBeInTheDocument();
            });
        });

        it('shows error snackbar when delete fails', async () => {
            mockedDelete.mockRejectedValue(new Error('Network error'));

            renderWithProviders(<ConstraintsView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Delete constraint')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete constraint'));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'DELETE' })).toBeInTheDocument();
            });
            fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));

            await waitFor(() => {
                expect(screen.getByText('Failed to delete constraint')).toBeInTheDocument();
            });
        });
    });
});
