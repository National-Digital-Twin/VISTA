import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppBody from '.';

vi.mock('./AppBodyLoadedContents', () => ({ default: () => <div data-testid="loaded-contents">Loaded Contents</div> }));

describe('AppBody', () => {
    describe('Rendering', () => {
        it('renders as main element', () => {
            render(<AppBody />);

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
        });

        it('renders with custom className', () => {
            render(<AppBody className="custom-class" />);

            const main = screen.getByRole('main');
            expect(main).toHaveClass('custom-class');
        });

        it('renders with multiple classNames', () => {
            render(<AppBody className="class-one class-two" />);

            const main = screen.getByRole('main');
            expect(main).toHaveClass('class-one', 'class-two');
        });

        it('renders without className when not provided', () => {
            render(<AppBody />);

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
        });
    });

    describe('Lazy Loading', () => {
        it('renders the lazy-loaded component', async () => {
            render(<AppBody />);

            await waitFor(() => {
                expect(screen.getByTestId('loaded-contents')).toBeInTheDocument();
            });
        });

        it('displays loaded content text', async () => {
            render(<AppBody />);

            await waitFor(() => {
                expect(screen.getByText('Loaded Contents')).toBeInTheDocument();
            });
        });

        it('lazy loads component asynchronously', async () => {
            const { container } = render(<AppBody />);

            const main = container.querySelector('main');
            expect(main).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByTestId('loaded-contents')).toBeInTheDocument();
            });
        });
    });

    describe('Semantic HTML', () => {
        it('uses semantic main element', () => {
            render(<AppBody />);

            const main = screen.getByRole('main');
            expect(main.tagName).toBe('MAIN');
        });

        it('maintains accessibility structure', () => {
            render(<AppBody />);

            const main = screen.getByRole('main');
            expect(main).toBeVisible();
        });
    });

    describe('Props Handling', () => {
        it('handles null className', () => {
            render(<AppBody className={undefined} />);

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
        });

        it('handles empty string className', () => {
            render(<AppBody className="" />);

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
        });
    });

    describe('Multiple Instances', () => {
        it('renders multiple instances independently', async () => {
            const { rerender } = render(<AppBody className="first" />);

            await waitFor(() => {
                expect(screen.getByTestId('loaded-contents')).toBeInTheDocument();
            });

            rerender(<AppBody className="second" />);

            await waitFor(() => {
                const main = screen.getByRole('main');
                expect(main).toHaveClass('second');
            });
        });
    });
});
