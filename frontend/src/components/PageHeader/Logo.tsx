import MenuIcon from '@mui/icons-material/Menu';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';

type LogoProps = {
    readonly appName: string;
    readonly onMobileMenuClick?: () => void;
};

export default function Logo({ appName, onMobileMenuClick }: LogoProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
            }}
        >
            {isMobile && (
                <IconButton
                    onClick={onMobileMenuClick}
                    sx={{
                        'color': 'white',
                        '&:hover': {
                            color: theme.palette.accent?.main || theme.palette.primary.light,
                        },
                    }}
                    aria-label="mobile menu"
                >
                    <MenuIcon />
                </IconButton>
            )}

            <img
                src={isMobile ? '/logo-mobile.svg' : '/logo.svg'}
                alt={`${appName} Logo`}
                style={{
                    height: '1.25rem',
                    objectFit: 'contain',
                }}
            />
        </Box>
    );
}
