// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InputIcon from '@mui/icons-material/Input';
import {
    Badge,
    Box,
    Container,
    Typography,
    Button,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { fetchDataSources, DataSource } from '@/api/datasources';
import { fetchScenarios, Scenario, setActiveScenario } from '@/api/scenarios';
import { useUserData } from '@/hooks/useUserData';

export interface DataRoomOutletContext {
    dataSources: DataSource[];
    isLoading: boolean;
    getFormattedLastUpdated: (value: string | null) => string;
}

type SidebarItemProps = {
    icon: ReactNode;
    active?: boolean;
    disabled?: boolean;
    to?: string;
    onClick?: () => void;
    badgeContent?: number;
    children: ReactNode;
};

function SidebarItem({ icon, active, disabled, to, onClick, badgeContent, children }: Readonly<SidebarItemProps>) {
    let rowColor: 'text.disabled' | 'primary.main' | 'text.primary' = 'text.primary';
    if (disabled) {
        rowColor = 'text.disabled';
    } else if (active) {
        rowColor = 'primary.main';
    }
    const rowSx = {
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'space-between',
        'p': 1.5,
        'pr': 2,
        'cursor': disabled ? 'default' : 'pointer',
        'borderRadius': 1,
        'backgroundColor': active ? 'chip.main' : 'transparent',
        'color': rowColor,
        'textDecoration': 'none',
        '&:hover': disabled
            ? undefined
            : {
                  backgroundColor: active ? 'chip.main' : 'action.hover',
              },
    };

    const left = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {icon}
            <Typography variant="body1" component="span" sx={{ textTransform: 'none' }}>
                {children}
            </Typography>
        </Box>
    );

    const right =
        badgeContent !== null && badgeContent !== undefined && badgeContent > 0 ? (
            <Badge badgeContent={badgeContent} color="error" sx={{ flexShrink: 0 }} />
        ) : null;

    if (to && !disabled) {
        return (
            <Box component={Link} to={to} sx={rowSx}>
                {left}
                {right}
            </Box>
        );
    }

    if (onClick && !disabled) {
        return (
            <Box component="button" type="button" onClick={onClick} sx={{ ...rowSx, border: 0, width: '100%', font: 'inherit', textAlign: 'left' }}>
                {left}
                {right}
            </Box>
        );
    }

    return (
        <Box sx={rowSx} aria-disabled={disabled}>
            {left}
            {right}
        </Box>
    );
}

export default function DataRoom() {
    const location = useLocation();
    const isManageScenariosActive = location.pathname.startsWith('/data-room/scenarios');
    const isDataSourcesActive = location.pathname === '/data-room' || location.pathname.startsWith('/data-room/data-source');

    const { data, isLoading, isError, error } = useQuery<DataSource[], Error>({
        queryKey: ['data-sources'],
        queryFn: fetchDataSources,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
    });
    const { data: scenariosData, isLoading: scenariosLoading } = useQuery<Scenario[]>({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
    });
    const { isAdmin } = useUserData();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
    const [errorQueue, setErrorQueue] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const showError = (message: string) => {
        setErrorQueue((prev) => [...prev, message]);
    };
    const handleClose = () => {
        setErrorSnackbarOpen(false);
        setErrorMessage(null);
    };

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

    const scenarios = scenariosData ?? [];
    const hasInitializedRef = useRef(false);
    const [selectedScenario, setSelectedScenario] = useState<string>(() => {
        return sessionStorage.getItem('selectedScenario') ?? '';
    });

    useEffect(() => {
        if (isError) {
            showError(error?.message ?? 'Failed to fetch data sources');
        }
    }, [isError, error]);

    useEffect(() => {
        if (scenariosData && scenariosData.length > 0 && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            const stored = sessionStorage.getItem('selectedScenario');
            const active = scenariosData.find((s) => s.isActive);
            const storedIsValid = stored && scenariosData.some((s) => s.id === stored);

            if (storedIsValid) {
                setSelectedScenario(stored);
            } else if (active) {
                setSelectedScenario(active.id);
            } else {
                setSelectedScenario(scenariosData[0].id);
            }
        }
    }, [scenariosData]);

    useEffect(() => {
        if (searchParams.get('openScenarioModal') === 'true') {
            setScenarioModalOpen(true);
            setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev);
                newParams.delete('openScenarioModal');
                return newParams;
            });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!errorSnackbarOpen && errorQueue.length > 0) {
            setErrorMessage(errorQueue[0]);
            setErrorSnackbarOpen(true);
            setErrorQueue((prev) => prev.slice(1));
        }
    }, [errorQueue, errorSnackbarOpen]);

    const activateScenarioMutation = useMutation({
        mutationFn: (scenarioId: string) => {
            return setActiveScenario(scenarioId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        },
        onError: () => {
            showError('Failed to activate scenario');
        },
    });

    const totalDataSources = data?.length ?? 0;
    const totalPendingExposure = scenarios.reduce((sum, s) => sum + (s.pendingExposureCount ?? 0), 0);

    const handleLoadScenarioClick = () => {
        setScenarioModalOpen(true);
    };

    const handleScenarioModalClose = () => {
        setScenarioModalOpen(false);
    };

    const handleScenarioConfirm = () => {
        sessionStorage.setItem('selectedScenario', selectedScenario);
        activateScenarioMutation.mutate(selectedScenario);
        setScenarioModalOpen(false);
    };

    const renderScenarioContent = () => {
        if (scenariosLoading) {
            return <Typography>Loading scenarios...</Typography>;
        }

        if (scenarios.length === 0) {
            return <Typography color="text.secondary">No scenarios available.</Typography>;
        }

        return (
            <RadioGroup value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                {scenarios.map((scenario) => (
                    <FormControlLabel key={scenario.id} value={scenario.id} control={<Radio />} label={scenario.name} />
                ))}
            </RadioGroup>
        );
    };

    return (
        <Container maxWidth={false} sx={{ py: 4, px: 3, pl: 0 }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' },
                    columnGap: { xs: 0, lg: 0 },
                    rowGap: { xs: 3, lg: 0 },
                    alignItems: { xs: 'start', lg: 'start' },
                }}
            >
                <Box
                    sx={{
                        pr: { lg: 3 },
                        pb: { xs: 3, lg: 0 },
                        borderRight: { xs: 'none', lg: '1px solid' },
                        borderColor: { lg: 'divider' },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        height: '100%',
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
                            Scenario management
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <SidebarItem icon={<AccountTreeIcon fontSize="small" />} disabled={!isAdmin} onClick={handleLoadScenarioClick}>
                                Load scenario
                            </SidebarItem>
                            <SidebarItem
                                icon={<EditNoteIcon fontSize="small" />}
                                disabled={!isAdmin}
                                to="/data-room/scenarios"
                                active={isManageScenariosActive}
                                badgeContent={isAdmin && totalPendingExposure > 0 ? totalPendingExposure : undefined}
                            >
                                Manage scenario
                            </SidebarItem>
                            <SidebarItem icon={<AddCircleOutlineOutlinedIcon fontSize="small" />} disabled>
                                Create new scenario
                            </SidebarItem>
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
                            Data sources and access management
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <SidebarItem icon={<InputIcon fontSize="small" />} to="/data-room" active={isDataSourcesActive}>
                                Data sources ({totalDataSources})
                            </SidebarItem>
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        pt: { xs: 0, lg: 0 },
                        pl: { xs: 0, lg: 3 },
                        pb: { xs: 1, lg: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Outlet context={{ dataSources: data, isLoading: isLoading, getFormattedLastUpdated: getFormattedLastUpdated }} />
                </Box>
            </Box>

            <Dialog open={scenarioModalOpen} onClose={handleScenarioModalClose} maxWidth="xs" fullWidth>
                <DialogTitle>Choose scenario</DialogTitle>
                <DialogContent>{renderScenarioContent()}</DialogContent>
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
                <Alert severity="error" onClose={handleClose}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}
