// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import graphqlLoader from 'vite-plugin-graphql-loader';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [react(), graphqlLoader()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        testTimeout: 15000,
        hookTimeout: 15000,
        css: {
            modules: {
                classNameStrategy: 'non-scoped',
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'node_modules/',
                '**/node_modules/**',
                'dist/',
                'qa/',
                'src/setupTests.ts',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                '**/*.config.{ts,js}',
                '**/types/',
                '**/declarations.d.ts',
                'src/vendor/**',
                '**/*.d.ts',
            ],
            all: true,
        },
    },
});
