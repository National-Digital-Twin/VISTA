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
