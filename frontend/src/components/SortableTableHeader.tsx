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
