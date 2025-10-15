/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MAP_TILER_TOKEN: string;
    readonly VITE_VISTA_API_URL: string;
    readonly VITE_ONTOLOGY_SERVICE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
