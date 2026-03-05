// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { TableCell, TableSortLabel } from '@mui/material';

type SortableTableHeaderProps<TSortField extends string> = {
    readonly field: TSortField;
    readonly label: string;
    readonly sortField: TSortField;
    readonly sortDirection: 'asc' | 'desc';
    readonly onSort: (field: TSortField) => void;
};

export function SortableTableHeader<TSortField extends string>({ field, label, sortField, sortDirection, onSort }: SortableTableHeaderProps<TSortField>) {
    return (
        <TableCell>
            <TableSortLabel active={sortField === field} direction={sortField === field ? sortDirection : 'asc'} onClick={() => onSort(field)}>
                {label}
            </TableSortLabel>
        </TableCell>
    );
}
