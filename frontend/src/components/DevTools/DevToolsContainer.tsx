import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

export type DevToolsContainerProps = {
    /** Children */
    readonly children: React.ReactNode;
};

export default function DevToolsContainer({ children }: DevToolsContainerProps) {
    return (
        <>
            <React.StrictMode>{children}</React.StrictMode>
            <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
    );
}
