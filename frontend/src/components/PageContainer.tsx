import React from 'react';
import { Container, ContainerProps } from '@mui/material';

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
