import { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Link,
    Stack,
    Divider,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import InputIcon from '@mui/icons-material/Input';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { format } from 'date-fns';
import { alpha } from '@mui/material/styles';
import PageContainer from '@/components/PageContainer';
import { SortableTableHeader } from '@/components/SortableTableHeader';
import { SearchTextField } from '@/components/SearchTextField';
import { fetchDataSources, DataSource } from '@/api/datasources';

type SortField = 'name' | 'owner' | 'assetCount' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

const getFormattedLastUpdated = (value: string | null): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return format(date, 'd MMM yyyy @ HH:mm');
};

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

const dataSourceMatchesSearch = (dataSource: DataSource, searchLower: string): boolean => {
    const matchesName = dataSource.name.toLowerCase().includes(searchLower);
    const matchesOwner = dataSource.owner.toLowerCase().includes(searchLower);
    const matchesAssetCount = String(dataSource.assetCount).includes(searchLower);
    const formattedLastUpdated = getFormattedLastUpdated(dataSource.lastUpdated);
    const matchesLastUpdated = formattedLastUpdated?.toLowerCase().includes(searchLower) ?? false;

    return matchesName || matchesOwner || matchesAssetCount || matchesLastUpdated;
};

export default function DataRoom() {
    const { data, isLoading, isError, error } = useQuery<DataSource[], Error>({
        queryKey: ['data-sources'],
        queryFn: fetchDataSources,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
    const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<string>('Flood in Newport');
    const errorMessage = isError ? (error?.message ?? 'Failed to fetch data sources') : null;

    useEffect(() => {
        if (errorMessage) {
            setErrorSnackbarOpen(true);
        } else {
            setErrorSnackbarOpen(false);
        }
    }, [errorMessage]);
    const totalDataSources = data?.length ?? 0;

    const filteredDataSources = useMemo<DataSource[]>(() => {
        const sources = data ?? [];

        if (!searchTerm) {
            return sources;
        }

        const searchLower = searchTerm.toLowerCase();
        return sources.filter((source) => dataSourceMatchesSearch(source, searchLower));
    }, [data, searchTerm]);

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

    const handleClearFilters = () => {
        setSearchTerm('');
    };

    const handleLoadScenarioClick = () => {
        setScenarioModalOpen(true);
    };

    const handleScenarioModalClose = () => {
        setScenarioModalOpen(false);
    };

    const handleScenarioConfirm = () => {
        sessionStorage.setItem('selectedScenario', selectedScenario);
        setScenarioModalOpen(false);
    };

    return (
        <PageContainer>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' },
                    columnGap: { xs: 0, lg: 4 },
                    rowGap: { xs: 3, lg: 0 },
                    alignItems: { xs: 'start', lg: 'start' },
                }}
            >
                <Box
                    sx={{
                        pr: { lg: 4 },
                        pb: { xs: 3, lg: 0 },
                        borderRight: { xs: 'none', lg: '1px solid' },
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        height: '100%',
                    }}
                >
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Scenario management
                        </Typography>
                        <Stack spacing={1}>
                            <Button
                                disableRipple
                                variant="text"
                                startIcon={<DriveFolderUploadIcon fontSize="small" />}
                                onClick={handleLoadScenarioClick}
                                sx={{
                                    'justifyContent': 'flex-start',
                                    'padding': 0,
                                    'minHeight': 'unset',
                                    'textTransform': 'none',
                                    'color': 'text.primary',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                Load scenario
                            </Button>
                            <Button
                                disableRipple
                                variant="text"
                                startIcon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
                                disabled
                                sx={{
                                    justifyContent: 'flex-start',
                                    padding: 0,
                                    minHeight: 'unset',
                                    textTransform: 'none',
                                    color: 'text.disabled',
                                }}
                            >
                                Create new scenario
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Data sources and access management
                        </Typography>
                        <Stack spacing={1}>
                            <Button
                                disableRipple
                                variant="text"
                                startIcon={<InputIcon fontSize="small" />}
                                sx={{
                                    'justifyContent': 'flex-start',
                                    'textTransform': 'none',
                                    'paddingY': 1,
                                    'paddingX': 1.5,
                                    'borderRadius': 2,
                                    'color': 'primary.main',
                                    'backgroundColor': (theme) => alpha(theme.palette.primary.main, 0.12),
                                    '&:hover': {
                                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                                    },
                                }}
                            >
                                <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: 'inherit' }}>
                                    Data sources ({totalDataSources})
                                </Typography>
                            </Button>
                        </Stack>
                    </Box>
                </Box>

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
                        <Button variant="outlined" onClick={handleClearFilters} disabled={!searchTerm}>
                            CLEAR FILTERS
                        </Button>
                    </Stack>

                    {isLoading ? (
                        <Typography>Loading data sources...</Typography>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <SortableTableHeader
                                            field="name"
                                            label="Data source"
                                            sortField={sortField}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableTableHeader
                                            field="owner"
                                            label="Owner"
                                            sortField={sortField}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        />
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
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedDataSources.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
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
                                                        to={`/data-source/${source.id}`}
                                                        underline="always"
                                                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                                                    >
                                                        {source.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{source.owner}</TableCell>
                                                <TableCell>{source.assetCount}</TableCell>
                                                <TableCell>{getFormattedLastUpdated(source.lastUpdated) ?? '—'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Box>

            <Dialog open={scenarioModalOpen} onClose={handleScenarioModalClose} maxWidth="xs" fullWidth>
                <DialogTitle>Choose scenario</DialogTitle>
                <DialogContent>
                    <RadioGroup value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                        <FormControlLabel value="Flood in Newport" control={<Radio />} label="Flood in Newport" />
                        <FormControlLabel value="Landslide in Ventnor" control={<Radio />} label="Landslide in Ventnor" />
                        <FormControlLabel value="Wildfire in Shanklin" control={<Radio />} label="Wildfire in Shanklin" />
                    </RadioGroup>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, mt: 2 }}>
                    <Button
                        onClick={handleScenarioModalClose}
                        variant="outlined"
                        sx={{
                            flex: 1,
                            mr: 1,
                            height: 48,
                            borderRadius: 1,
                        }}
                    >
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleScenarioConfirm}
                        variant="contained"
                        sx={{
                            flex: 2,
                            height: 48,
                            borderRadius: 1,
                        }}
                    >
                        CONFIRM
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={errorSnackbarOpen}
                autoHideDuration={5000}
                onClose={() => setErrorSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setErrorSnackbarOpen(false)}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
