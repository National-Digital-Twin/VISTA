// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccessRequestsTab from './AccessRequestsTab';

describe('AccessRequestsTab', () => {
    it('renders placeholder content', () => {
        render(<AccessRequestsTab />);

        expect(screen.getByText('Manage access requests')).toBeInTheDocument();
        expect(screen.getByText('Manage access requests functionality will be implemented here.')).toBeInTheDocument();
    });
});
