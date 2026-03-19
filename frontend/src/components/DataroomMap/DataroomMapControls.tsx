// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, styled } from '@mui/material';
import ControlButton from '@/components/map-v2/ControlButton';

const ControlsContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
    position: 'absolute',
    right: '0.75rem',
    top: '0.75rem',
    zIndex: 2,
});

type DataroomMapControlsProps = {
    drawing?: {
        onDraw: () => void;
    };
    visibilityToggle?: {
        visible: boolean;
        onToggle: () => void;
        tooltip: string;
    };
};

const DataroomMapControls = ({ drawing, visibilityToggle }: Readonly<DataroomMapControlsProps>) => {
    if (!drawing && !visibilityToggle) {
        return null;
    }

    return (
        <ControlsContainer>
            {drawing && (
                <ControlButton onClick={drawing.onDraw} aria-label="Draw filter area" tooltip="Draw filter area" isActive>
                    <img src="/icons/map-v2/polygon.svg" alt="Draw area" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
                </ControlButton>
            )}

            {visibilityToggle && (
                <ControlButton onClick={visibilityToggle.onToggle} aria-label={visibilityToggle.tooltip} tooltip={visibilityToggle.tooltip} isActive>
                    {visibilityToggle.visible ? <VisibilityIcon sx={{ fontSize: 24 }} /> : <VisibilityOffIcon sx={{ fontSize: 24 }} />}
                </ControlButton>
            )}
        </ControlsContainer>
    );
};

export default DataroomMapControls;
