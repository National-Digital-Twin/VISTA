// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

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
