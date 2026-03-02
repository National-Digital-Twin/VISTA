import CloseIcon from '@mui/icons-material/Close';
import { Box, Typography, IconButton } from '@mui/material';
import AssetDetailsPanel from './AssetDetailsPanel';
import type { Asset } from '@/api/assets-by-type';

type InspectorViewProps = {
    selectedElement: Asset | null;
    onBack?: () => void;
    onClose?: () => void;
    scenarioId?: string;
    onConnectedAssetsVisibilityChange?: (
        visible: boolean,
        dependents: Array<{ id: string; geom: string; type: { name: string } }>,
        providers: Array<{ id: string; geom: string; type: { name: string } }>,
    ) => void;
};

const InspectorView = ({ selectedElement, onBack, onClose, scenarioId, onConnectedAssetsVisibilityChange }: InspectorViewProps) => {
    if (!selectedElement) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                        Inspector
                    </Typography>
                    {onClose && (
                        <IconButton size="small" onClick={onClose} aria-label="Close panel">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                <Box sx={{ p: 2 }}>
                    <Typography variant="body1">Select an asset on the map to inspect its details.</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <AssetDetailsPanel
            selectedElement={selectedElement}
            onBack={onBack}
            onClose={onClose}
            scenarioId={scenarioId}
            onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange}
        />
    );
};

export default InspectorView;
