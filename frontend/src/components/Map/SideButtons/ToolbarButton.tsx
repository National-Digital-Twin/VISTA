import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';
import Tooltip from '@mui/material/Tooltip';
import { IconButton } from '@mui/material';
import Badge from '@mui/material/Badge';

export interface ToolbarButtonProps {
    /** The title shown on hover for the button */
    readonly title: string;
    readonly width?: number;
    readonly height?: number;
    readonly hasNoMarginBottom?: boolean;
    /** The FontAwesome icon to be shown (preferred) */
    readonly icon?: IconProp;
    /** The FontAwesome icon size to be shown (preferred) */
    readonly iconSize?: SizeProp;
    /** The SVG source to be shown */
    readonly svgSrc?: string;
    /** Action on click */
    readonly onClick: () => void;
    /** Number to be shown as a badge (optional) */
    readonly badgeContent?: number;
    /** Rotation angle for compass (optional) */
    readonly compassRotation?: number;
    /** Whether the button is in active state */
    readonly active?: boolean;
    /** Whether the button is disabled */
    readonly disabled?: boolean;
}

export default function ToolbarButton({
    title,
    width,
    height,
    hasNoMarginBottom,
    icon,
    svgSrc,
    onClick,
    badgeContent,
    iconSize,
    compassRotation,
    active = false,
    disabled = false,
}: ToolbarButtonProps) {
    const button = (
        <IconButton
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            sx={{
                'backgroundColor': active ? '#3670B3' : 'white',
                'color': active ? 'white' : 'black',
                'borderRadius': '4px',
                'boxShadow': '0px 4px 8px 0px rgba(0,0,0,0.2)',
                'fontSize': '2.0rem',
                'padding': 1,
                'marginBottom': hasNoMarginBottom ? 0 : 1,
                'width': width ?? '6vh',
                'height': height ?? '6vh',
                'maxHeight': 48,
                'maxWidth': 48,
                'display': 'flex',
                'alignItems': 'center',
                'justifyContent': 'center',
                '&:hover': {
                    backgroundColor: active ? '#2a5a8f' : '#f0f0f0',
                },
                '& img': {
                    filter: active ? 'brightness(0) invert(100%)' : 'none',
                },
                '&:disabled': {
                    'backgroundColor': '#aab4be',
                    'color': '#5D5A5A',
                    '& img': {
                        filter: 'grayscale(100%) opacity(0.5)',
                    },
                },
            }}
        >
            <Badge badgeContent={badgeContent} color="error">
                {svgSrc ? (
                    <img
                        src={svgSrc}
                        alt={title}
                        style={{
                            width: '100%',
                            height: '100%',
                            transform: compassRotation === undefined ? undefined : `rotate(${compassRotation}deg)`,
                        }}
                    />
                ) : (
                    icon && <FontAwesomeIcon icon={icon} size={iconSize || '1x'} />
                )}
            </Badge>
        </IconButton>
    );

    return (
        <Tooltip title={title} enterDelay={500}>
            {disabled ? <span>{button}</span> : button}
        </Tooltip>
    );
}
