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
