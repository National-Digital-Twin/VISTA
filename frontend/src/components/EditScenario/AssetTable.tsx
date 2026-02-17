import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import { SortableTableHeader } from '@/components/SortableTableHeader';
import type { DataroomAsset } from '@/api/dataroom-assets';

type SortField = 'id' | 'name' | 'assetTypeName' | 'subCategoryName' | 'categoryName' | 'criticalityScore';
type SortDirection = 'asc' | 'desc';

type AssetTableProps = {
    assets: DataroomAsset[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    isLoading?: boolean;
};

export default function AssetTable({ assets, selectedIds, onSelectionChange, isLoading }: Readonly<AssetTableProps>) {
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
        },
        [sortField],
    );

    const sortedAssets = useMemo(() => {
        return [...assets].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }, [assets, sortField, sortDirection]);

    const paginatedAssets = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedAssets.slice(start, start + rowsPerPage);
    }, [sortedAssets, page, rowsPerPage]);

    useEffect(() => {
        setPage(0);
    }, [assets]);

    const allSelected = assets.length > 0 && assets.every((a) => selectedIds.has(a.id));
    const someSelected = assets.some((a) => selectedIds.has(a.id));

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(assets.map((a) => a.id)));
        }
    }, [allSelected, assets, onSelectionChange]);

    const handleToggle = useCallback(
        (id: string) => {
            const next = new Set(selectedIds);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            onSelectionChange(next);
        },
        [selectedIds, onSelectionChange],
    );

    if (isLoading) {
        return <Typography sx={{ p: 2 }}>Loading assets...</Typography>;
    }

    return (
        <Box>
            <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { fontSize: '0.8rem' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox indeterminate={someSelected && !allSelected} checked={allSelected} onChange={handleSelectAll} />
                            </TableCell>
                            <SortableTableHeader field="id" label="ID" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="name" label="Asset" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader
                                field="assetTypeName"
                                label="Asset type"
                                sortField={sortField}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableTableHeader
                                field="subCategoryName"
                                label="Sub category"
                                sortField={sortField}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableTableHeader
                                field="categoryName"
                                label="Category"
                                sortField={sortField}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableTableHeader
                                field="criticalityScore"
                                label="Criticality score"
                                sortField={sortField}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                            />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedAssets.map((asset) => {
                            const isSelected = selectedIds.has(asset.id);
                            return (
                                <TableRow key={asset.id} hover selected={isSelected} sx={{ cursor: 'pointer' }} onClick={() => handleToggle(asset.id)}>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={isSelected} />
                                    </TableCell>
                                    <TableCell>{asset.id}</TableCell>
                                    <TableCell>{asset.name || 'Name unknown'}</TableCell>
                                    <TableCell>{asset.assetTypeName}</TableCell>
                                    <TableCell>{asset.subCategoryName}</TableCell>
                                    <TableCell>{asset.categoryName}</TableCell>
                                    <TableCell align="center">{asset.criticalityScore}</TableCell>
                                </TableRow>
                            );
                        })}
                        {paginatedAssets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">No assets found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={sortedAssets.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(Number.parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
            />
        </Box>
    );
}
