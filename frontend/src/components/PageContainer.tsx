// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Container, ContainerProps } from '@mui/material';
import React from 'react';

type PageContainerProps = Omit<ContainerProps, 'maxWidth'> & {
    children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children, sx, ...props }) => {
    return (
        <Container
            maxWidth="xl"
            sx={{
                py: 4,
                width: '100%',
                ...sx,
            }}
            {...props}
        >
            {children}
        </Container>
    );
};

export default PageContainer;
