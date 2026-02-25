import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import EditCriticalityDialog from './EditCriticalityDialog';
import theme from '@/theme';

const renderDialog = (props?: Partial<Parameters<typeof EditCriticalityDialog>[0]>) => {
    const defaultProps = {
        open: true,
        count: 5,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
    };

    return render(
        <ThemeProvider theme={theme}>
            <EditCriticalityDialog {...defaultProps} {...props} />
        </ThemeProvider>,
    );
};

describe('EditCriticalityDialog', () => {
    it('renders title with item count', () => {
        renderDialog({ count: 5 });
        expect(screen.getByText('Edit 5 items')).toBeInTheDocument();
    });

    it('renders singular title for one item', () => {
        renderDialog({ count: 1 });
        expect(screen.getByText('Edit 1 item')).toBeInTheDocument();
    });

    it('renders description text', () => {
        renderDialog({ count: 3 });
        expect(screen.getByText('You are changing the criticality score for 3 items')).toBeInTheDocument();
    });

    it('renders criticality score input', () => {
        renderDialog();
        expect(screen.getByLabelText('Criticality score')).toBeInTheDocument();
    });

    it('renders CANCEL and CONFIRM buttons', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'CONFIRM' })).toBeInTheDocument();
    });

    it('calls onClose when CANCEL is clicked', () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onConfirm with score when CONFIRM is clicked', () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        fireEvent.change(screen.getByLabelText('Criticality score'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }));

        expect(onConfirm).toHaveBeenCalledWith(2);
    });

    it('disables CONFIRM when input is empty', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: 'CONFIRM' })).toBeDisabled();
    });

    it('does not render when closed', () => {
        renderDialog({ open: false });
        expect(screen.queryByText('Edit 5 items')).not.toBeInTheDocument();
    });

    it('calls onConfirm on Enter key', () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        const input = screen.getByLabelText('Criticality score');
        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onConfirm).toHaveBeenCalledWith(1);
    });
});
