import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import ComplexLayerControl from '.';

describe('ComplexLayerControl', () => {
    const defaultProps = {
        title: 'Test Layer',
        children: <div data-testid="layer-content">Layer Content</div>,
    };

    const getHeader = () => screen.getByText('Test Layer').closest('[tabIndex]');
    const clickHeader = () => fireEvent.click(getHeader()!);

    describe('Rendering', () => {
        it('renders with title and icon', () => {
            render(<ComplexLayerControl {...defaultProps} icon={faLayerGroup} />);

            expect(screen.getByText('Test Layer')).toBeInTheDocument();
        });

        it('renders without icon', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            expect(screen.getByText('Test Layer')).toBeInTheDocument();
        });

        it('starts collapsed by default', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const content = screen.getByTestId('layer-content');
            expect(content).not.toBeVisible();
        });

        it('hides count by default when hideCount is true', () => {
            render(<ComplexLayerControl {...defaultProps} hideCount />);

            expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
        });
    });

    describe('Expand/Collapse', () => {
        it('expands content when header is clicked', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.click(header!);

            const content = screen.getByTestId('layer-content');
            expect(content).toBeVisible();
        });

        it('collapses content when header is clicked twice', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.click(header!);
            fireEvent.click(header!);

            const content = screen.getByTestId('layer-content');
            expect(content).not.toBeVisible();
        });

        it('expands when Enter key is pressed', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.keyDown(header!, { key: 'Enter' });

            const content = screen.getByTestId('layer-content');
            expect(content).toBeVisible();
        });

        it('expands when Space key is pressed', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.keyDown(header!, { key: ' ' });

            const content = screen.getByTestId('layer-content');
            expect(content).toBeVisible();
        });

        it('does not expand on other key presses', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.keyDown(header!, { key: 'Tab' });

            const content = screen.getByTestId('layer-content');
            expect(content).not.toBeVisible();
        });
    });

    describe('Selected Count', () => {
        const FunctionChildren = ({ updateCount, showDeselect = true }: { updateCount: (selected: boolean) => void; showDeselect?: boolean }) => (
            <>
                <button onClick={() => updateCount(true)}>Select</button>
                {showDeselect && <button onClick={() => updateCount(false)}>Deselect</button>}
            </>
        );

        it('updates count when using function children', () => {
            render(
                <ComplexLayerControl title="Test Layer">
                    {(updateCount: (selected: boolean) => void) => <FunctionChildren updateCount={updateCount} />}
                </ComplexLayerControl>,
            );

            clickHeader();
            expect(screen.getByText('Test Layer')).toHaveTextContent('Test Layer');

            fireEvent.click(screen.getByText('Select'));
            expect(screen.getByText(/Test Layer \(1\)/)).toBeInTheDocument();

            fireEvent.click(screen.getByText('Select'));
            expect(screen.getByText(/Test Layer \(2\)/)).toBeInTheDocument();

            fireEvent.click(screen.getByText('Deselect'));
            expect(screen.getByText(/Test Layer \(1\)/)).toBeInTheDocument();
        });

        it('does not decrement count below zero', () => {
            render(
                <ComplexLayerControl title="Test Layer">
                    {(updateCount: (selected: boolean) => void) => <FunctionChildren updateCount={updateCount} showDeselect={true} />}
                </ComplexLayerControl>,
            );

            clickHeader();
            fireEvent.click(screen.getByText('Deselect'));
            expect(screen.getByText('Test Layer')).not.toHaveTextContent('(-');
        });

        it('hides count when hideCount prop is true', () => {
            render(
                <ComplexLayerControl title="Test Layer" hideCount>
                    {(updateCount: (selected: boolean) => void) => <FunctionChildren updateCount={updateCount} showDeselect={false} />}
                </ComplexLayerControl>,
            );

            clickHeader();
            fireEvent.click(screen.getByText('Select'));
            expect(screen.queryByText(/\(1\)/)).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('header is keyboard focusable', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            expect(header).toHaveAttribute('tabIndex', '0');
        });

        it('content area has aria-expanded attribute', () => {
            render(<ComplexLayerControl {...defaultProps} />);

            const contentWrapper = screen.getByTestId('layer-content').parentElement?.parentElement;
            expect(contentWrapper).toHaveAttribute('aria-expanded', 'false');

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.click(header!);

            expect(contentWrapper).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('Auto Show/Hide', () => {
        it('sets data-auto-show-hide attribute when prop is true', () => {
            const { container } = render(<ComplexLayerControl {...defaultProps} autoShowHide />);

            const wrapper = container.querySelector('[data-auto-show-hide]');
            expect(wrapper).toHaveAttribute('data-auto-show-hide', 'true');
        });

        it('sets data-expanded attribute based on expanded state', () => {
            const { container } = render(<ComplexLayerControl {...defaultProps} />);

            const wrapper = container.querySelector('[data-expanded]');
            expect(wrapper).toHaveAttribute('data-expanded', 'false');

            const header = screen.getByText('Test Layer').closest('[tabIndex]');
            fireEvent.click(header!);

            expect(wrapper).toHaveAttribute('data-expanded', 'true');
        });
    });
});
