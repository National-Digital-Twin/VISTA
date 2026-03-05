// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import DevTools from '.';

vi.mock('./DevToolsContainer', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="devtools-container">{children}</div>,
}));

describe('DevTools', () => {
    it('renders only children when disabled', () => {
        render(
            <DevTools enabled={false}>
                <div data-testid="app-content">App Content</div>
            </DevTools>,
        );

        expect(screen.getByTestId('app-content')).toBeInTheDocument();
        expect(screen.queryByTestId('devtools-container')).not.toBeInTheDocument();
    });

    it('renders DevToolsContainer and children when enabled', async () => {
        render(
            <DevTools enabled={true}>
                <div data-testid="app-content">App Content</div>
            </DevTools>,
        );

        expect(screen.getByText('Loading dev tools...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('devtools-container')).toBeInTheDocument();
        });

        expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });
});
