// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import DeleteDialog from './index';
import theme from '@/theme';

const renderWithTheme = (props: React.ComponentProps<typeof DeleteDialog>) => {
    return render(
        <ThemeProvider theme={theme}>
            <DeleteDialog {...props} />
        </ThemeProvider>,
    );
};

describe('DeleteDialog', () => {
    it('renders nothing when closed', () => {
        renderWithTheme({
            open: false,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange: vi.fn(),
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title, instruction, input and buttons when open', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange: vi.fn(),
        });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        expect(screen.getByText('Type delete to confirm')).toBeInTheDocument();
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');
        expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'CONFIRM DELETION' })).toBeInTheDocument();
    });

    it('renders custom title and description when provided', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange: vi.fn(),
            title: 'Remove item?',
            description: 'This action cannot be undone.',
        });
        expect(screen.getByText('Remove item?')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('disables confirm button when confirm text does not match', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: 'delet',
            onConfirmTextChange: vi.fn(),
        });
        expect(screen.getByRole('button', { name: 'CONFIRM DELETION' })).toBeDisabled();
    });

    it('enables confirm button when user types the confirm word (case-insensitive)', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: 'delete',
            onConfirmTextChange: vi.fn(),
        });
        expect(screen.getByRole('button', { name: 'CONFIRM DELETION' })).not.toBeDisabled();
    });

    it('enables confirm button when user types confirm word in uppercase', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: 'DELETE',
            onConfirmTextChange: vi.fn(),
        });
        expect(screen.getByRole('button', { name: 'CONFIRM DELETION' })).not.toBeDisabled();
    });

    it('calls onConfirmTextChange when user types in the input', () => {
        const onConfirmTextChange = vi.fn();
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange,
        });
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'delete' } });
        expect(onConfirmTextChange).toHaveBeenCalledWith('delete');
    });

    it('calls onClose when cancel is clicked', () => {
        const onClose = vi.fn();
        renderWithTheme({
            open: true,
            onClose,
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange: vi.fn(),
        });
        fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close icon is clicked', () => {
        const onClose = vi.fn();
        renderWithTheme({
            open: true,
            onClose,
            onConfirm: vi.fn(),
            confirmText: '',
            onConfirmTextChange: vi.fn(),
        });
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm is clicked and text matches', () => {
        const onConfirm = vi.fn();
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm,
            confirmText: 'delete',
            onConfirmTextChange: vi.fn(),
        });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM DELETION' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables confirm button when isPending is true', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: 'delete',
            onConfirmTextChange: vi.fn(),
            isPending: true,
        });
        expect(screen.getByRole('button', { name: 'CONFIRM DELETION' })).toBeDisabled();
    });

    it('uses custom confirmWord when provided', () => {
        renderWithTheme({
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            confirmText: 'remove',
            onConfirmTextChange: vi.fn(),
            confirmWord: 'remove',
            confirmButtonLabel: 'REMOVE',
        });
        expect(screen.getByRole('button', { name: 'REMOVE' })).not.toBeDisabled();
    });
});
