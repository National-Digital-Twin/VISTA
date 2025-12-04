import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export type DevToolsContainerProps = {
    /** Children */
    readonly children: React.ReactNode;
};

export default function DevToolsContainer({ children }: DevToolsContainerProps) {
    return (
        <>
            <React.StrictMode>{children}</React.StrictMode>
            <ReactQueryDevtools />
        </>
    );
}
