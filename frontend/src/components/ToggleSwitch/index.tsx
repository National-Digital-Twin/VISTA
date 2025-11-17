import { styled } from '@mui/material/styles';
import Switch, { type SwitchProps } from '@mui/material/Switch';

const ToggleSwitch = styled((props: SwitchProps) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(({ theme }) => ({
    'width': 41,
    'height': 26,
    'padding': 0,
    'margin-right': 4,
    '& .MuiSwitch-switchBase': {
        'padding': 0,
        'margin': 2,
        'transitionDuration': '300ms',
        'transform': 'translateY(1px)',
        '&.Mui-checked': {
            'transform': 'translateX(16px) translateY(1px)',
            'color': '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: theme.palette.primary.main,
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.grey[100],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.7,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 20,
        height: 20,
        backgroundColor: '#fff',
    },
    '& .MuiSwitch-track': {
        borderRadius: 27 / 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.25)',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 300,
        }),
    },
}));

export default ToggleSwitch;
