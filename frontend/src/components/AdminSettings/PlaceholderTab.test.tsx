// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlaceholderTab from './PlaceholderTab';

describe('PlaceholderTab', () => {
    it('renders title with coming soon label', () => {
        render(<PlaceholderTab title="Manage access requests" />);

        expect(screen.getByText('Manage access requests')).toBeInTheDocument();
        expect(screen.getByText('(coming soon)')).toBeInTheDocument();
    });

    it('renders optional description when provided', () => {
        render(<PlaceholderTab title="My tab" description="This feature is under development." />);

        expect(screen.getByText('This feature is under development.')).toBeInTheDocument();
    });
});
