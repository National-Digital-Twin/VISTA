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
            default: '#f0f2f2',
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
        chip: {
            main: '#D4E3FF',
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
                root: {
                    '&.Mui-selected': {
                        backgroundColor: '#f0f2f2',
                    },
                },
            },
        },
    },
});
declare module '@mui/material/styles' {
    interface Palette {
        accent: Palette['primary'];
        border: Palette['primary'];
        chip: Palette['primary'];
    }

    interface PaletteOptions {
        accent?: PaletteOptions['primary'];
        border?: PaletteOptions['primary'];
        chip?: PaletteOptions['primary'];
    }
}

export default theme;
