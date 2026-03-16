// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RadiusDialog from './RadiusDialog';

describe('RadiusDialog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders when open is true', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Enter circle radius')).toBeInTheDocument();
        });

        it('does not render when open is false', () => {
            render(<RadiusDialog {...defaultProps} open={false} />);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders input field with correct label', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByLabelText('Radius (km)')).toBeInTheDocument();
        });

        it('renders helper text when no error', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByText('Enter the radius of the circle in kilometers')).toBeInTheDocument();
        });

        it('renders Cancel and Confirm buttons', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        });

        it('renders close button in title', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
        });

        it('has Confirm button disabled initially', () => {
            render(<RadiusDialog {...defaultProps} />);
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
        });
    });

    describe('input validation', () => {
        it('enables Confirm button when valid number is entered', async () => {
            const user = userEvent.setup();
            render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');

            expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
        });

        it('shows error for negative numbers', async () => {
            const user = userEvent.setup();
            render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '-5');

            expect(screen.getByText('Please enter a valid positive number')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
        });

        it('shows error for zero', async () => {
            const user = userEvent.setup();
            render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '0');

            expect(screen.getByText('Please enter a valid positive number')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
        });

        it('accepts decimal numbers', async () => {
            const user = userEvent.setup();
            render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '2.5');

            expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
            expect(screen.queryByText('Please enter a valid positive number')).not.toBeInTheDocument();
        });

        it('clears error when input is cleared', async () => {
            const user = userEvent.setup();
            render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '-5');
            expect(screen.getByText('Please enter a valid positive number')).toBeInTheDocument();

            await user.clear(input);
            expect(screen.queryByText('Please enter a valid positive number')).not.toBeInTheDocument();
        });
    });

    describe('confirm action', () => {
        it('calls onConfirm with radius value when Confirm button is clicked', async () => {
            const user = userEvent.setup();
            const onConfirm = vi.fn();
            render(<RadiusDialog {...defaultProps} onConfirm={onConfirm} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            await user.click(screen.getByRole('button', { name: 'Confirm' }));

            expect(onConfirm).toHaveBeenCalledWith(5);
        });

        it('calls onClose after confirming', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<RadiusDialog {...defaultProps} onClose={onClose} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            await user.click(screen.getByRole('button', { name: 'Confirm' }));

            expect(onClose).toHaveBeenCalled();
        });

        it('clears input after confirming', async () => {
            const user = userEvent.setup();
            const { rerender } = render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            await user.click(screen.getByRole('button', { name: 'Confirm' }));

            rerender(<RadiusDialog {...defaultProps} />);
            expect(screen.getByLabelText('Radius (km)')).toHaveValue(null);
        });

        it('calls onConfirm with decimal value', async () => {
            const user = userEvent.setup();
            const onConfirm = vi.fn();
            render(<RadiusDialog {...defaultProps} onConfirm={onConfirm} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '2.5');
            await user.click(screen.getByRole('button', { name: 'Confirm' }));

            expect(onConfirm).toHaveBeenCalledWith(2.5);
        });
    });

    describe('cancel action', () => {
        it('calls onClose when Cancel button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<RadiusDialog {...defaultProps} onClose={onClose} />);

            await user.click(screen.getByRole('button', { name: 'Cancel' }));

            expect(onClose).toHaveBeenCalled();
        });

        it('calls onClose when close icon button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<RadiusDialog {...defaultProps} onClose={onClose} />);

            await user.click(screen.getByRole('button', { name: 'close' }));

            expect(onClose).toHaveBeenCalled();
        });

        it('clears input when cancelled', async () => {
            const user = userEvent.setup();
            const { rerender } = render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            await user.click(screen.getByRole('button', { name: 'Cancel' }));

            rerender(<RadiusDialog {...defaultProps} />);
            expect(screen.getByLabelText('Radius (km)')).toHaveValue(null);
        });

        it('clears error when cancelled', async () => {
            const user = userEvent.setup();
            const { rerender } = render(<RadiusDialog {...defaultProps} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '-5');
            expect(screen.getByText('Please enter a valid positive number')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Cancel' }));

            rerender(<RadiusDialog {...defaultProps} />);
            expect(screen.queryByText('Please enter a valid positive number')).not.toBeInTheDocument();
        });
    });

    describe('keyboard interactions', () => {
        it('confirms on Enter key when input is valid', async () => {
            const user = userEvent.setup();
            const onConfirm = vi.fn();
            render(<RadiusDialog {...defaultProps} onConfirm={onConfirm} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onConfirm).toHaveBeenCalledWith(5);
        });

        it('does not confirm on Enter key when input is empty', async () => {
            const onConfirm = vi.fn();
            render(<RadiusDialog {...defaultProps} onConfirm={onConfirm} />);

            const input = screen.getByLabelText('Radius (km)');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('does not confirm on Enter key when input has error', async () => {
            const user = userEvent.setup();
            const onConfirm = vi.fn();
            render(<RadiusDialog {...defaultProps} onConfirm={onConfirm} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '-5');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('cancels on Escape key', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            render(<RadiusDialog {...defaultProps} onClose={onClose} />);

            const input = screen.getByLabelText('Radius (km)');
            await user.type(input, '5');
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('focus behavior', () => {
        it('auto-focuses the input field when opened', async () => {
            render(<RadiusDialog {...defaultProps} />);
            const input = screen.getByLabelText('Radius (km)');
            await vi.waitFor(() => {
                expect(input).toHaveFocus();
            });
        });
    });
});
