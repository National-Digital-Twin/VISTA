import { forwardRef } from 'react';
import { IconButton, Tooltip, tooltipClasses, type IconButtonProps, styled } from '@mui/material';

const StyledIconButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
    'backgroundColor': isActive ? theme.palette.primary.main : theme.palette.background.paper,
    'borderRadius': theme.shape.borderRadius,
    'boxShadow': theme.shadows[3],
    'color': isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
    'height': '3rem',
    'width': '3rem',
    '&:hover': {
        backgroundColor: isActive ? theme.palette.primary.dark : theme.palette.action.hover,
    },
}));

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[2],
        fontSize: theme.typography.pxToRem(12),
        borderRadius: theme.shape.borderRadius,
    },
}));

type ControlButtonProps = Pick<IconButtonProps, 'onClick' | 'disabled' | 'children' | 'aria-label'> & {
    tooltip?: string;
    isActive?: boolean;
};

const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(({ onClick, disabled, children, 'aria-label': ariaLabel, tooltip, isActive }, ref) => {
    const button = (
        <StyledIconButton ref={ref} onClick={onClick} disabled={disabled} aria-label={ariaLabel} isActive={isActive}>
            {children}
        </StyledIconButton>
    );

    if (tooltip) {
        return (
            <StyledTooltip title={tooltip} placement="left">
                <span>{button}</span>
            </StyledTooltip>
        );
    }

    return button;
});

ControlButton.displayName = 'ControlButton';

export default ControlButton;
