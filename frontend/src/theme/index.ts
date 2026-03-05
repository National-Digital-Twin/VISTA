// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#3670b3',
        },
        secondary: {
            main: '#002244',
        },
        background: {
            default: '#ffffff',
        },
        text: {
            primary: '#0e142b',
        },
        error: {
            main: '#bd0000',
        },
        accent: {
            main: '#ffcf06',
        },
        border: {
            main: '#c2c2c2',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
        chip: {
            main: '#D4E3FF',
        },
        neutral: {
            main: '#f0f2f2',
        },
    },
    typography: {
        fontFamily: ['Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 1051,
            lg: 1200,
            xl: 1536,
        },
    },
    components: {
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'white',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: ({ theme }) => ({
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.neutral.main,
                    },
                }),
            },
        },
    },
});
declare module '@mui/material/styles' {
    interface Palette {
        accent: Palette['primary'];
        border: Palette['primary'];
        chip: Palette['primary'];
        neutral: Palette['primary'];
    }

    interface PaletteOptions {
        accent?: PaletteOptions['primary'];
        border?: PaletteOptions['primary'];
        chip?: PaletteOptions['primary'];
        neutral?: PaletteOptions['primary'];
    }
}

export default theme;
