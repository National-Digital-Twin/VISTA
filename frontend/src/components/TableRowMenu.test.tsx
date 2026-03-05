// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { MenuItem } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { TableRowMenuButton, TableRowMenu } from './TableRowMenu';
import theme from '@/theme';

const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('TableRowMenuButton', () => {
    it('renders with aria-label', () => {
        renderWithTheme(<TableRowMenuButton aria-label="Row actions" onClick={() => {}} />);
        expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        renderWithTheme(<TableRowMenuButton aria-label="Actions" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('TableRowMenu', () => {
    it('renders children when open', () => {
        renderWithTheme(
            <TableRowMenu anchorEl={null} open={true} onClose={() => {}}>
                <MenuItem>Remove</MenuItem>
            </TableRowMenu>,
        );
        expect(screen.getByRole('menuitem', { name: 'Remove' })).toBeInTheDocument();
    });

    it('calls onClose when menu close is triggered', async () => {
        const onClose = vi.fn();
        renderWithTheme(
            <TableRowMenu anchorEl={null} open={true} onClose={onClose}>
                <MenuItem onClick={onClose}>Remove</MenuItem>
            </TableRowMenu>,
        );
        fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
        expect(onClose).toHaveBeenCalled();
    });
});
