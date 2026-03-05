// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, type BoxProps } from '@mui/material';
import { type ReactNode } from 'react';

type StatusPillProps = {
    readonly children: ReactNode;
    readonly isActive: boolean;
    readonly width?: string | number;
    readonly sx?: BoxProps['sx'];
} & Omit<BoxProps, 'children' | 'sx'>;

const StatusPill = ({ children, isActive, width, sx, ...boxProps }: StatusPillProps) => {
    return (
        <Box
            {...boxProps}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: isActive ? '#7eb66d' : '#929292',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                ...(width && { width, minWidth: width, maxWidth: width }),
                ...sx,
            }}
        >
            {children}
        </Box>
    );
};

export default StatusPill;
