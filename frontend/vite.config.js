// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    build: {
        sourcemap: true,
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
    server: {
        proxy: {
            // Transparent proxy
            '/transparent-proxy': {
                target: 'http://localhost:5013',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/transparent-proxy/, ''),
                secure: false,
            },
            // Coefficent python
            '/ndtp-python': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ndtp-python/, ''),
                secure: false,
            },
        },
    },
});
