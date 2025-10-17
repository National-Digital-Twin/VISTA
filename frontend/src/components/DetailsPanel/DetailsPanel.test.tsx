import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DetailsPanel from './DetailsPanel';

vi.mock('./style.module.css', () => ({
    default: {
        detailsPanel: 'detailsPanel',
        resizeHandle: 'resizeHandle',
        toggleButton: 'toggleButton',
        content: 'content',
        noSelect: 'noSelect',
    },
}));

describe('DetailsPanel', () => {
    const defaultProps = {
        isOpen: true,
        children: <div data-testid="panel-content">Test Content</div>,
    };

    describe('Rendering', () => {
        it('renders children correctly', () => {
            render(<DetailsPanel {...defaultProps} />);

            expect(screen.getByTestId('panel-content')).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('renders without close button when onClose is not provided', () => {
            render(<DetailsPanel {...defaultProps} />);

            const closeButton = screen.queryByRole('button');
            expect(closeButton).not.toBeInTheDocument();
        });

        it('renders close button when onClose is provided', () => {
            render(<DetailsPanel {...defaultProps} onClose={vi.fn()} />);

            const closeButton = screen.getByRole('button');
            expect(closeButton).toBeInTheDocument();
        });

        it('applies correct data-expanded attribute when open', () => {
            const { container } = render(<DetailsPanel {...defaultProps} />);

            const card = container.querySelector('[data-expanded]');
            expect(card).toHaveAttribute('data-expanded', 'true');
        });

        it('applies correct data-expanded attribute when closed', () => {
            const { container } = render(<DetailsPanel {...defaultProps} isOpen={false} />);

            const card = container.querySelector('[data-expanded]');
            expect(card).toHaveAttribute('data-expanded', 'false');
        });
    });

    describe('Close Button Interaction', () => {
        it('calls onClose when close button is clicked', () => {
            const handleClose = vi.fn();
            render(<DetailsPanel {...defaultProps} onClose={handleClose} />);

            const closeButton = screen.getByRole('button');
            fireEvent.click(closeButton);

            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('does not crash when clicking close button multiple times', () => {
            const handleClose = vi.fn();
            render(<DetailsPanel {...defaultProps} onClose={handleClose} />);

            const closeButton = screen.getByRole('button');
            fireEvent.click(closeButton);
            fireEvent.click(closeButton);
            fireEvent.click(closeButton);

            expect(handleClose).toHaveBeenCalledTimes(3);
        });
    });

    describe('State Changes', () => {
        it('updates when isOpen prop changes', () => {
            const { container, rerender } = render(<DetailsPanel {...defaultProps} isOpen={false} />);

            let card = container.querySelector('[data-expanded]');
            expect(card).toHaveAttribute('data-expanded', 'false');

            rerender(<DetailsPanel {...defaultProps} isOpen={true} />);

            card = container.querySelector('[data-expanded]');
            expect(card).toHaveAttribute('data-expanded', 'true');
        });

        it('updates children when they change', () => {
            const { rerender } = render(<DetailsPanel {...defaultProps} />);

            expect(screen.getByText('Test Content')).toBeInTheDocument();

            rerender(
                <DetailsPanel {...defaultProps}>
                    <div data-testid="new-content">New Content</div>
                </DetailsPanel>,
            );

            expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
            expect(screen.getByText('New Content')).toBeInTheDocument();
        });
    });

    describe('Content Scrolling', () => {
        it('has scrollable content area', () => {
            render(<DetailsPanel {...defaultProps} />);

            const content = screen.getByTestId('panel-content').parentElement;
            expect(content).toHaveStyle({ overflowY: 'auto' });
        });

        it('renders multiple children correctly', () => {
            render(
                <DetailsPanel isOpen={true}>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <div data-testid="child-3">Child 3</div>
                </DetailsPanel>,
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
            expect(screen.getByTestId('child-3')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('close button is keyboard accessible', () => {
            const handleClose = vi.fn();
            render(<DetailsPanel {...defaultProps} onClose={handleClose} />);

            const closeButton = screen.getByRole('button');
            closeButton.focus();

            expect(document.activeElement).toBe(closeButton);
        });

        it('content is accessible when panel is open', () => {
            render(<DetailsPanel {...defaultProps} />);

            const content = screen.getByTestId('panel-content');
            expect(content).toBeVisible();
        });
    });

    describe('Edge Cases', () => {
        it('handles null children gracefully', () => {
            const { container } = render(<DetailsPanel isOpen={true}>{null}</DetailsPanel>);

            const card = container.querySelector('[data-expanded]');
            expect(card).toBeInTheDocument();
        });

        it('handles undefined children gracefully', () => {
            const { container } = render(<DetailsPanel isOpen={true}>{undefined}</DetailsPanel>);

            const card = container.querySelector('[data-expanded]');
            expect(card).toBeInTheDocument();
        });

        it('handles empty fragment as children', () => {
            const { container } = render(
                <DetailsPanel isOpen={true}>
                    <></>
                </DetailsPanel>,
            );

            const card = container.querySelector('[data-expanded]');
            expect(card).toBeInTheDocument();
        });
    });
});
