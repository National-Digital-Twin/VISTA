// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MAP_TILER_TOKEN: string;
    readonly VITE_ONTOLOGY_SERVICE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
