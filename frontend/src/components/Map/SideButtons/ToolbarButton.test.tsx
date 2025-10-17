import { faCompass, faCircle } from '@fortawesome/free-solid-svg-icons';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ToolbarButton from './ToolbarButton';

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: ({ icon }: any) => <div data-testid="fa-icon">{icon[1]}</div>,
}));

describe('ToolbarButton', () => {
    const defaultProps = {
        title: 'Test Button',
        onClick: vi.fn(),
    };

    describe('Icon Rendering', () => {
        it('renders with FontAwesome icon', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
        });

        it('renders with SVG image when svgSrc is provided', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" />);

            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('src', '/test-icon.svg');
            expect(img).toHaveAttribute('alt', 'Test Button');
        });

        it('prefers SVG over FontAwesome icon when both provided', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} svgSrc="/test-icon.svg" />);

            expect(screen.getByRole('img')).toBeInTheDocument();
            expect(screen.queryByTestId('fa-icon')).not.toBeInTheDocument();
        });

        it('applies icon size when specified', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} iconSize="2x" />);

            expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
        });

        it('uses default icon size when not specified', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
        });
    });

    describe('Click Handling', () => {
        it('calls onClick when button is clicked', () => {
            const onClick = vi.fn();
            render(<ToolbarButton {...defaultProps} onClick={onClick} icon={faCompass} />);

            const button = screen.getByRole('button', { name: /test button/i });
            fireEvent.click(button);

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when disabled', () => {
            const onClick = vi.fn();
            render(<ToolbarButton {...defaultProps} onClick={onClick} icon={faCompass} disabled={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            fireEvent.click(button);

            expect(onClick).not.toHaveBeenCalled();
        });

        it('handles multiple rapid clicks', () => {
            const onClick = vi.fn();
            render(<ToolbarButton {...defaultProps} onClick={onClick} icon={faCompass} />);

            const button = screen.getByRole('button', { name: /test button/i });
            fireEvent.click(button);
            fireEvent.click(button);
            fireEvent.click(button);

            expect(onClick).toHaveBeenCalledTimes(3);
        });
    });

    describe('Badge Display', () => {
        it('displays badge content when provided', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} badgeContent={3} />);

            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('does not display badge when content is zero', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} badgeContent={0} />);

            expect(screen.queryByText('0')).not.toBeInTheDocument();
        });

        it('displays large badge numbers as 99+', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} badgeContent={999} />);

            expect(screen.getByText('99+')).toBeInTheDocument();
        });

        it('works with badge and SVG icon', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" badgeContent={5} />);

            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByRole('img')).toBeInTheDocument();
        });
    });

    describe('Compass Rotation', () => {
        it('applies compass rotation to SVG', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test.svg" compassRotation={45} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ transform: 'rotate(45deg)' });
        });

        it('applies negative rotation', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test.svg" compassRotation={-90} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ transform: 'rotate(-90deg)' });
        });

        it('applies 360 degree rotation', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test.svg" compassRotation={360} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ transform: 'rotate(360deg)' });
        });

        it('does not apply rotation when not specified', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test.svg" />);

            const img = screen.getByRole('img');
            expect(img).not.toHaveStyle({ transform: 'rotate(0deg)' });
        });
    });

    describe('Active State', () => {
        it('applies active state styling to button', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" active={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({
                backgroundColor: 'rgb(54, 112, 179)',
                color: 'rgb(255, 255, 255)',
            });
        });

        it('applies active state filter to SVG', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" active={true} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ filter: 'brightness(0) invert(100%)' });
        });

        it('applies default styling when not active', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" active={false} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(0, 0, 0)',
            });

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ filter: 'none' });
        });

        it('works with FontAwesome icons', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} active={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({
                backgroundColor: 'rgb(54, 112, 179)',
            });
        });
    });

    describe('Disabled State', () => {
        it('applies disabled state styling to button', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" disabled={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toBeDisabled();
            expect(button).toHaveStyle({
                backgroundColor: 'rgb(170, 180, 190)',
                color: 'rgb(93, 90, 90)',
            });
        });

        it('applies disabled state filter to SVG', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test-icon.svg" disabled={true} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({ filter: 'grayscale(100%) opacity(0.5)' });
        });

        it('wraps disabled button in span for tooltip', () => {
            const { container } = render(<ToolbarButton {...defaultProps} icon={faCompass} disabled={true} />);

            const span = container.querySelector('span');
            expect(span).toBeInTheDocument();
        });
    });

    describe('Tooltip', () => {
        it('displays title as tooltip', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveAttribute('aria-label', 'Test Button');
        });

        it('uses title for image alt text', () => {
            render(<ToolbarButton {...defaultProps} title="Custom Title" svgSrc="/test.svg" />);

            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('alt', 'Custom Title');
        });
    });

    describe('Size Customization', () => {
        it('applies custom width and height', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} width={100} height={100} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({
                width: '100px',
                height: '100px',
            });
        });

        it('uses default size when not specified', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({
                maxWidth: '48px',
                maxHeight: '48px',
            });
        });

        it('applies hasNoMarginBottom prop', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} hasNoMarginBottom={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({ marginBottom: '0px' });
        });
    });

    describe('Accessibility', () => {
        it('has accessible name from title', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
        });

        it('is keyboard focusable when enabled', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            const button = screen.getByRole('button', { name: /test button/i });
            button.focus();

            expect(document.activeElement).toBe(button);
        });

        it('maintains proper button semantics', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} />);

            const button = screen.getByRole('button');
            expect(button.tagName).toBe('BUTTON');
        });
    });

    describe('Combined States', () => {
        it('handles active and disabled together', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} active={true} disabled={true} />);

            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toBeDisabled();
        });

        it('handles badge with active state', () => {
            render(<ToolbarButton {...defaultProps} icon={faCompass} active={true} badgeContent={5} />);

            expect(screen.getByText('5')).toBeInTheDocument();
            const button = screen.getByRole('button', { name: /test button/i });
            expect(button).toHaveStyle({ backgroundColor: 'rgb(54, 112, 179)' });
        });

        it('handles rotation with active state', () => {
            render(<ToolbarButton {...defaultProps} svgSrc="/test.svg" compassRotation={45} active={true} />);

            const img = screen.getByRole('img');
            expect(img).toHaveStyle({
                transform: 'rotate(45deg)',
                filter: 'brightness(0) invert(100%)',
            });
        });
    });
});
