import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Link, Stack, Button } from '@mui/material';
import { useState, useMemo } from 'react';
import { Link as RouterLink, useOutletContext } from 'react-router-dom';
import { DataSource } from '@/api/datasources';
import { DataRoomOutletContext } from '@/components/DataRoom';
import { SearchTextField } from '@/components/SearchTextField';
import { SortableTableHeader } from '@/components/SortableTableHeader';

type SortField = 'name' | 'owner' | 'assetCount' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

const getFieldValue = (source: DataSource, field: SortField): string | number => {
    switch (field) {
        case 'name':
            return source.name.toLowerCase();
        case 'owner':
            return source.owner.toLowerCase();
        case 'assetCount':
            return source.assetCount;
        case 'lastUpdated':
            return source.lastUpdated ? new Date(source.lastUpdated).getTime() : 0;
        default:
            return '';
    }
};

const compareDataSources =
    (field: SortField, direction: SortDirection) =>
    (a: DataSource, b: DataSource): number => {
        const aValue = getFieldValue(a, field);
        const bValue = getFieldValue(b, field);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return direction === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    };

const dataSourceMatchesSearch = (dataSource: DataSource, searchLower: string, getFormattedLastUpdated: (value: string | null) => string): boolean => {
    const matchesName = dataSource.name.toLowerCase().includes(searchLower);
    const matchesOwner = dataSource.owner.toLowerCase().includes(searchLower);
    const matchesAssetCount = String(dataSource.assetCount).includes(searchLower);
    const formattedLastUpdated = getFormattedLastUpdated(dataSource.lastUpdated);
    const matchesLastUpdated = formattedLastUpdated?.toLowerCase().includes(searchLower) ?? false;
    const accessLevel = (dataSource.globallyAvailable ?? true) ? 'available to all' : 'restricted access';
    const matchesAccessLevel = accessLevel.includes(searchLower);
    const matchesGroupAccess = (dataSource.groupsWithAccess ?? []).some((group) => group.name.toLowerCase().includes(searchLower));

    return matchesName || matchesOwner || matchesAssetCount || matchesLastUpdated || matchesAccessLevel || matchesGroupAccess;
};

export default function DataSources() {
    const { dataSources, isLoading, getFormattedLastUpdated } = useOutletContext<DataRoomOutletContext>();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const filteredDataSources = useMemo<DataSource[]>(() => {
        const sources = dataSources ?? [];

        if (!searchTerm) {
            return sources;
        }

        const searchLower = searchTerm.toLowerCase();
        return sources.filter((source) => dataSourceMatchesSearch(source, searchLower, getFormattedLastUpdated));
    }, [dataSources, searchTerm, getFormattedLastUpdated]);

    const sortedDataSources = useMemo<DataSource[]>(() => {
        return [...filteredDataSources].sort(compareDataSources(sortField, sortDirection));
    }, [filteredDataSources, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <Box
            sx={{
                pt: { xs: 0, lg: 0 },
                pl: { xs: 0, lg: 0 },
                pb: { xs: 1, lg: 3 },
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    mb: 3,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <SearchTextField placeholder="Search for a data source" value={searchTerm} onChange={setSearchTerm} />
                <Button variant="outlined" disabled={!searchTerm} onClick={() => setSearchTerm('')}>
                    Clear filters
                </Button>
            </Stack>

            {isLoading ? (
                <Typography>Loading data sources...</Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <SortableTableHeader field="name" label="Data source" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                                <SortableTableHeader field="owner" label="Owner" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                                <SortableTableHeader
                                    field="assetCount"
                                    label="# of assets"
                                    sortField={sortField}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableTableHeader
                                    field="lastUpdated"
                                    label="Last updated"
                                    sortField={sortField}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                />
                                <TableCell>Access level</TableCell>
                                <TableCell>Group access</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedDataSources.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography color="text.secondary">
                                            {searchTerm ? 'No data sources match your search.' : 'No data sources available.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedDataSources.map((source) => (
                                    <TableRow key={source.id}>
                                        <TableCell>
                                            <Link
                                                component={RouterLink}
                                                to={`/data-room/data-source/${source.id}`}
                                                underline="always"
                                                sx={{ color: 'primary.main', cursor: 'pointer' }}
                                            >
                                                {source.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{source.owner}</TableCell>
                                        <TableCell>{source.assetCount}</TableCell>
                                        <TableCell>{getFormattedLastUpdated(source.lastUpdated) ?? '—'}</TableCell>
                                        <TableCell>{(source.globallyAvailable ?? true) ? 'Available to all' : 'Restricted access'}</TableCell>
                                        <TableCell>
                                            {(source.groupsWithAccess ?? []).length > 0 ? (
                                                <Stack spacing={0.25}>
                                                    {(source.groupsWithAccess ?? []).map((group) => (
                                                        <Link
                                                            key={group.id}
                                                            component={RouterLink}
                                                            to={`/admin?tab=groups&group=${encodeURIComponent(group.id)}`}
                                                            underline="always"
                                                            sx={{ color: 'primary.main', cursor: 'pointer' }}
                                                        >
                                                            {group.name}
                                                        </Link>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
