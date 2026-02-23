import { type MouseEvent, type ReactNode } from 'react';
import { IconButton, Menu } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const tableRowMenuButtonSx = {
    'backgroundColor': 'rgba(0, 0, 0, 0.04)',
    'borderRadius': '4px',
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    '&.Mui-focusVisible': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
};

type TableRowMenuButtonProps = {
    'aria-label': string;
    'onClick': (e: MouseEvent<HTMLButtonElement>) => void;
    'size'?: 'small' | 'medium';
    'open'?: boolean;
};

export function TableRowMenuButton({ 'aria-label': ariaLabel, onClick, size = 'small', open = false }: Readonly<TableRowMenuButtonProps>) {
    return (
        <IconButton
            size={size}
            aria-label={ariaLabel}
            onClick={onClick}
            sx={{
                ...tableRowMenuButtonSx,
                ...(open && { backgroundColor: 'rgba(0, 0, 0, 0.12)' }),
            }}
        >
            <MoreHorizIcon fontSize="small" />
        </IconButton>
    );
}

type TableRowMenuProps = {
    anchorEl: null | HTMLElement;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
};

export function TableRowMenu({ anchorEl, open, onClose, children }: Readonly<TableRowMenuProps>) {
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
                paper: {
                    sx: {
                        minWidth: 180,
                        mt: 0.5,
                    },
                },
            }}
        >
            {children}
        </Menu>
    );
}
