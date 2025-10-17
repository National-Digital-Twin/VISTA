import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MapToolbar from './MapToolbar';
import { ToolOrder } from '@/tools/useTools';

vi.mock('@/tools/useTools', () => ({
    useTools: vi.fn(() => (_order: ToolOrder) => [
        {
            TOOL_NAME: 'ToolWithButtons',
            SideButtons: () => <div data-testid="side-button">Side Button A</div>,
        },
        {
            TOOL_NAME: 'ToolWithoutButtons',
        },
    ]),
}));

describe('MapToolbar', () => {
    it('renders side buttons from tools', () => {
        render(<MapToolbar />);

        expect(screen.getByTestId('side-button')).toBeInTheDocument();
        expect(screen.getByText('Side Button A')).toBeInTheDocument();

        expect(screen.queryAllByTestId('side-button')).toHaveLength(1);
    });

    it('applies additional className if provided', () => {
        const { container } = render(<MapToolbar className="custom-toolbar" />);
        const toolbarElement = container.firstChild as HTMLElement;
        expect(toolbarElement).toHaveClass('custom-toolbar');
    });
});
