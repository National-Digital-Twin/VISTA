import { useState, useEffect, useRef } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
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
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import PageContainer from '@/components/PageContainer';
import { fetchDataSources, DataSource } from '@/api/datasources';
import { fetchScenarios, Scenario, setActiveScenario } from '@/api/scenarios';
import { useUserData } from '@/hooks/useUserData';

export interface DataRoomOutletContext {
    dataSources: DataSource[];
    isLoading: boolean;
    getFormattedLastUpdated: (value: string | null) => string;
}

export default function DataRoom() {
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
    const { getUserType } = useUserData();
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
                                disabled={getUserType() !== 'Admin'}
                                variant="text"
                                startIcon={<AccountTreeIcon fontSize="small" />}
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
        </PageContainer>
    );
}
