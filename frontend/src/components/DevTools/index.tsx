// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React, { lazy, Suspense, memo } from 'react';

export type DevToolsProps = {
    /** Whether the dev tools are enabled */
    readonly enabled: boolean;
    /** The wrapped app content */
    readonly children: React.ReactNode;
};

const DevToolsContainer = lazy(() => import('./DevToolsContainer'));

function DevTools({ enabled, children }: DevToolsProps) {
    if (!enabled) {
        return children;
    }

    return (
        <Suspense fallback={<p>Loading dev tools...</p>}>
            <DevToolsContainer>{children}</DevToolsContainer>
        </Suspense>
    );
}

export default memo(DevTools);
