// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, CircularProgress } from '@mui/material';

type LoadingOverlayProps = {
    readonly isLoading: boolean;
    readonly size?: number;
};

const LoadingOverlay = ({ isLoading, size = 48 }: LoadingOverlayProps) => (
    <Box
        sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 10,
            opacity: isLoading ? 1 : 0,
            pointerEvents: isLoading ? 'auto' : 'none',
            transition: 'opacity 200ms ease-out',
        }}
    >
        <CircularProgress size={size} />
    </Box>
);

export default LoadingOverlay;
