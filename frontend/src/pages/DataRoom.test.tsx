import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataRoom from './DataRoom';

describe('DataRoom', () => {
    describe('Rendering', () => {
        it('renders the page title', () => {
            render(<DataRoom />);

            expect(screen.getByText('Data Room')).toBeInTheDocument();
        });

        it('renders placeholder message', () => {
            render(<DataRoom />);

            expect(
                screen.getByText('This is a placeholder for the data room page. The design and functionality will be implemented in a future update.'),
            ).toBeInTheDocument();
        });

        it('renders coming soon section', () => {
            render(<DataRoom />);

            expect(screen.getByText('Data Room Coming Soon')).toBeInTheDocument();
            expect(screen.getByText('This feature is under development.')).toBeInTheDocument();
        });
    });

    describe('Icons', () => {
        it('renders the storage icon', () => {
            render(<DataRoom />);

            const icons = screen.getAllByTestId('StorageIcon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });

    describe('Structure', () => {
        it('has semantic heading', () => {
            render(<DataRoom />);

            const heading = screen.getByRole('heading', { level: 1, name: 'Data Room' });
            expect(heading).toBeInTheDocument();
        });

        it('uses proper heading hierarchy', () => {
            render(<DataRoom />);

            const h1 = screen.getByRole('heading', { level: 1 });
            expect(h1).toBeInTheDocument();

            const h6 = screen.getByRole('heading', { level: 6 });
            expect(h6).toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('renders all page elements', () => {
            render(<DataRoom />);

            expect(screen.getByText('Data Room')).toBeInTheDocument();
            expect(
                screen.getByText('This is a placeholder for the data room page. The design and functionality will be implemented in a future update.'),
            ).toBeInTheDocument();
            expect(screen.getByText('Data Room Coming Soon')).toBeInTheDocument();
        });
    });
});
