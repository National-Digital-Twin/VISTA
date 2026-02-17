import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, IconButton, Snackbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { fetchScenarios, type Scenario } from '@/api/scenarios';
import DataroomMap from '@/components/DataroomMap';
import { useUserData } from '@/hooks/useUserData';

export default function ManageScenario() {
    const { id } = useParams<{ id: string }>();
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

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isError) {
            setErrorMessage(error?.message ?? 'Failed to fetch scenarios');
        }
    }, [isError, error]);

    const scenario = scenarios?.find((s) => s.id === id);

    if (userLoading || isLoading) {
        return <Typography>Loading...</Typography>;
    }

    if (!isAdmin) {
        return <Navigate to="/data-room" replace />;
    }

    if (!scenario) {
        return <Typography color="error">Scenario not found.</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate('/data-room/scenarios')} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {scenario.code || scenario.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {scenario.name}
                        </Typography>
                    </Box>
                </Box>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/data-room/scenarios/${id}/edit`)}>
                    EDIT
                </Button>
            </Box>

            <Box sx={{ height: 350, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <DataroomMap height="100%" />
            </Box>

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
