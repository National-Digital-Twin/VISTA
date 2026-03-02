import { Table, TableHead, TableRow } from '@mui/material';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { SortableTableHeader } from './SortableTableHeader';

type TestSortField = 'name' | 'email' | 'date';

const renderInTable = (component: React.ReactElement) => {
    return render(
        <Table>
            <TableHead>
                <TableRow>{component}</TableRow>
            </TableHead>
        </Table>,
    );
};

describe('SortableTableHeader', () => {
    const defaultProps = {
        field: 'name' as TestSortField,
        label: 'Name',
        sortField: 'name' as TestSortField,
        sortDirection: 'asc' as const,
        onSort: vi.fn(),
    };

    describe('Rendering', () => {
        it('renders the label text', () => {
            renderInTable(<SortableTableHeader {...defaultProps} />);

            expect(screen.getByText('Name')).toBeInTheDocument();
        });

        it('renders with different label', () => {
            renderInTable(<SortableTableHeader {...defaultProps} label="Email Address" />);

            expect(screen.getByText('Email Address')).toBeInTheDocument();
        });
    });

    describe('Active State', () => {
        it('is active when sortField matches field', () => {
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root');
            expect(sortLabel).toHaveClass('Mui-active');
        });

        it('is not active when sortField does not match field', () => {
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} sortField="email" />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root');
            expect(sortLabel).not.toHaveClass('Mui-active');
        });
    });

    describe('Sort Direction', () => {
        it('shows ascending direction when active and sortDirection is asc', () => {
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} sortDirection="asc" />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root');
            expect(sortLabel).toHaveClass('MuiTableSortLabel-directionAsc');
        });

        it('shows descending direction when active and sortDirection is desc', () => {
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} sortDirection="desc" />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root');
            expect(sortLabel).toHaveClass('MuiTableSortLabel-directionDesc');
        });

        it('defaults to ascending direction when not active', () => {
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} field="email" sortField="name" sortDirection="desc" />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root');
            expect(sortLabel).not.toHaveClass('Mui-active');
        });
    });

    describe('Click Handler', () => {
        it('calls onSort with correct field when clicked', () => {
            const onSort = vi.fn();
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} onSort={onSort} />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root') as HTMLElement;
            fireEvent.click(sortLabel);

            expect(onSort).toHaveBeenCalledTimes(1);
            expect(onSort).toHaveBeenCalledWith('name');
        });

        it('calls onSort with different field when different field is clicked', () => {
            const onSort = vi.fn();
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} field="email" label="Email" onSort={onSort} />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root') as HTMLElement;
            fireEvent.click(sortLabel);

            expect(onSort).toHaveBeenCalledTimes(1);
            expect(onSort).toHaveBeenCalledWith('email');
        });

        it('calls onSort even when header is not currently active', () => {
            const onSort = vi.fn();
            const { container } = renderInTable(<SortableTableHeader {...defaultProps} field="date" label="Date" sortField="name" onSort={onSort} />);

            const sortLabel = container.querySelector('.MuiTableSortLabel-root') as HTMLElement;
            fireEvent.click(sortLabel);

            expect(onSort).toHaveBeenCalledTimes(1);
            expect(onSort).toHaveBeenCalledWith('date');
        });
    });

    describe('Type Safety', () => {
        it('works with different SortField types', () => {
            type CustomSortField = 'custom1' | 'custom2';
            const onSort = vi.fn();
            const { container } = renderInTable(
                <SortableTableHeader<CustomSortField> field="custom1" label="Custom Field" sortField="custom1" sortDirection="asc" onSort={onSort} />,
            );

            expect(screen.getByText('Custom Field')).toBeInTheDocument();

            const sortLabel = container.querySelector('.MuiTableSortLabel-root') as HTMLElement;
            fireEvent.click(sortLabel);

            expect(onSort).toHaveBeenCalledWith('custom1');
        });
    });
});
