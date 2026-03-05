// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Alert, Badge, Box, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchScenarios, type Scenario } from '@/api/scenarios';
import { SearchTextField } from '@/components/SearchTextField';
import { SortableTableHeader } from '@/components/SortableTableHeader';
import { useUserData } from '@/hooks/useUserData';

type SortField = 'code' | 'name' | 'isActive';
type SortDirection = 'asc' | 'desc';

export default function ManageScenarios() {
    const navigate = useNavigate();
    const { isAdmin, loading: userLoading } = useUserData();

    const {
        data: scenarios,
        isLoading,
        isError,
        error,
    } = useQuery<Scenario[], Error>({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
    });

    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('code');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isError) {
            setErrorMessage(error?.message ?? 'Failed to fetch scenarios');
        }
    }, [isError, error]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredScenarios = useMemo(() => {
        if (!scenarios) {
            return [];
        }

        let filtered = scenarios;
        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter((s) => s.name.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower));
        }

        return [...filtered].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : Number(aVal) - Number(bVal);
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }, [scenarios, search, sortField, sortDirection]);

    if (userLoading || isLoading) {
        return <Typography>Loading scenarios...</Typography>;
    }

    if (!isAdmin) {
        return <Navigate to="/data-room" replace />;
    }

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <SearchTextField value={search} onChange={setSearch} placeholder="Search for a scenario" />
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 48, paddingX: 1 }} />
                            <SortableTableHeader field="code" label="Scenario ID" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="name" label="Incident type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableTableHeader field="isActive" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredScenarios.map((scenario) => (
                            <TableRow key={scenario.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/data-room/scenarios/${scenario.id}`)}>
                                <TableCell sx={{ width: 48, paddingX: 1 }} align="center">
                                    {(scenario.pendingExposureCount ?? 0) > 0 ? <Badge badgeContent={scenario.pendingExposureCount} color="error" /> : null}
                                </TableCell>
                                <TableCell>
                                    <Typography sx={{ color: 'primary.main', fontWeight: 500 }}>{scenario.code || scenario.id}</Typography>
                                </TableCell>
                                <TableCell>{scenario.name}</TableCell>
                                <TableCell>
                                    {scenario.isActive ? (
                                        <Chip label="Active" color="success" size="small" />
                                    ) : (
                                        <Chip label="Inactive" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredScenarios.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography color="text.secondary">No scenarios found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={5000}
                onClose={() => setErrorMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setErrorMessage(null)}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
