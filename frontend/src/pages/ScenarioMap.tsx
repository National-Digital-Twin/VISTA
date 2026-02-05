import { Box } from '@mui/material';
import MapView from '@/components/map-v2/MapView';
import { RouteProvider } from '@/components/map-v2/context/RouteContext';
import { useActiveScenario } from '@/hooks/useActiveScenario';

const ScenarioMap = () => {
    const { data: activeScenario } = useActiveScenario();
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                bgcolor: 'background.default',
            }}
        >
            <RouteProvider scenarioId={activeScenario?.id}>
                <MapView />
            </RouteProvider>
        </Box>
    );
};

export default ScenarioMap;
