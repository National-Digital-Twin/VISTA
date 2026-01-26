import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Typography } from '@mui/material';
import StatusPill from './index';

describe('StatusPill', () => {
    it('renders with active state (green)', () => {
        render(
            <StatusPill isActive={true}>
                <Typography variant="caption">1 / 30</Typography>
            </StatusPill>,
        );
        const pill = screen.getByText('1 / 30');
        expect(pill).toBeInTheDocument();
        expect(pill.closest('div')).toHaveStyle({ backgroundColor: '#7eb66d' });
    });

    it('renders with inactive state (grey)', () => {
        render(
            <StatusPill isActive={false}>
                <Typography variant="caption">0 / 63</Typography>
            </StatusPill>,
        );
        const pill = screen.getByText('0 / 63');
        expect(pill).toBeInTheDocument();
        expect(pill.closest('div')).toHaveStyle({ backgroundColor: '#929292' });
    });

    it('renders custom content', () => {
        render(
            <StatusPill isActive={true}>
                <span>Custom content</span>
            </StatusPill>,
        );
        expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('applies fixed width when provided', () => {
        render(
            <StatusPill isActive={true} width="140px">
                <Typography variant="caption">1 / 30</Typography>
            </StatusPill>,
        );
        const pill = screen.getByText('1 / 30').closest('div');
        expect(pill).toHaveStyle({ width: '140px', minWidth: '140px', maxWidth: '140px' });
    });

    it('allows custom sx props', () => {
        render(
            <StatusPill isActive={true} sx={{ mt: 2 }}>
                <Typography variant="caption">Test</Typography>
            </StatusPill>,
        );
        const pill = screen.getByText('Test').closest('div');
        expect(pill).toBeInTheDocument();
    });
});
