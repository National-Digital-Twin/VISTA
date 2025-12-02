import { Box } from '@mui/material';
import MapView from '@/components/map-v2/MapView';

const ScenarioMap = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                bgcolor: 'background.default',
            }}
        >
            <MapView />
        </Box>
    );
};

export default ScenarioMap;
