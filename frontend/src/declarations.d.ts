// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.jpg' {
    const value: string;
    export default value;
}

declare module '*.jpeg' {
    const value: string;
    export default value;
}

declare module '*.gif' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    const value: string;
    export default value;
}

declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

interface ImportMetaEnv {
    readonly MODE: string;
    readonly PROD: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module 'mapbox-gl-draw-rectangle-mode' {
    import { DrawCustomMode } from '@mapbox/mapbox-gl-draw';

    const RectangleMode: DrawCustomMode;
    export default RectangleMode;
}

declare module '*.graphql' {
    import type { DocumentNode } from 'graphql';
    const value: DocumentNode;
    export default value;
}
