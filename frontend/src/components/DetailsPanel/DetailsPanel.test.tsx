import { render, screen, fireEvent } from '@testing-library/react';
import DetailsPanel from './DetailsPanel';

// Mock styles (CSS modules)
jest.mock('./style.module.css', () => ({
    detailsPanel: 'detailsPanel',
    resizeHandle: 'resizeHandle',
    toggleButton: 'toggleButton',
    content: 'content',
    noSelect: 'noSelect',
}));

describe('DetailsPanel', () => {
    it('renders children correctly', () => {
        render(
            <DetailsPanel isOpen={true}>
                <div data-testid="panel-content">Hello panel</div>
            </DetailsPanel>,
        );
        expect(screen.getByTestId('panel-content')).toBeInTheDocument();
    });

    it('sets data-expanded attribute based on isOpen prop', () => {
        const { rerender } = render(<DetailsPanel isOpen={false}>Test</DetailsPanel>);
        expect(screen.getByText('Test').closest('[data-expanded]')).toHaveAttribute('data-expanded', 'false');

        rerender(<DetailsPanel isOpen={true}>Test</DetailsPanel>);
        expect(screen.getByText('Test').closest('[data-expanded]')).toHaveAttribute('data-expanded', 'true');
    });

    it('calls onClose when toggle button is clicked', () => {
        const handleClose = jest.fn();
        render(
            <DetailsPanel isOpen={true} onClose={handleClose}>
                Test
            </DetailsPanel>,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(handleClose).toHaveBeenCalled();
    });

    it('renders with correct styling when open', () => {
        render(<DetailsPanel isOpen={true}>Test</DetailsPanel>);

        const card = screen.getByText('Test').closest('[data-expanded]');
        expect(card).toHaveAttribute('data-expanded', 'true');
        expect(card).toHaveClass('MuiCard-root');
    });
});
