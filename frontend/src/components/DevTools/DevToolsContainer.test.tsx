import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DevToolsContainer from './DevToolsContainer';

vi.mock('@tanstack/react-query-devtools', () => ({
    ReactQueryDevtools: () => <div data-testid="react-query-devtools" />,
}));

describe('DevToolsContainer', () => {
    it('renders children and ReactQueryDevtools', () => {
        render(
            <DevToolsContainer>
                <div data-testid="child">Hello Child</div>
            </DevToolsContainer>,
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Hello Child')).toBeInTheDocument();

        expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument();
    });
});
