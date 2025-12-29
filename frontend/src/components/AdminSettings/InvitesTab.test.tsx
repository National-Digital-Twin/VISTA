import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvitesTab from './InvitesTab';

describe('InvitesTab', () => {
    it('renders the coming soon message', () => {
        render(<InvitesTab />);

        expect(screen.getByRole('heading', { name: /manage user invites/i })).toBeInTheDocument();
        expect(screen.getByText('(coming soon)', { exact: false })).toBeInTheDocument();
    });
});
