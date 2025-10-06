import { Box, Button, useTheme } from '@mui/material';
import { useNavigation } from '@/hooks/useNavigation';

interface NavigationProps {
    readonly onNavigationClick?: (item: string) => void;
}

export default function Navigation({ onNavigationClick }: NavigationProps) {
    const theme = useTheme();
    const { navigationItems, isActive, handleNavigationClick, isMobile } = useNavigation();

    const handleClick = (item: { to: string; label: string }) => {
        onNavigationClick?.(item.label);
        handleNavigationClick(item);
    };

    if (isMobile) {
        return null;
    }

    return (
        <Box display="flex" gap={2}>
            {navigationItems.map((item) => (
                <Button
                    key={item.to}
                    variant="text"
                    onClick={() => handleClick(item)}
                    sx={{
                        'color': isActive(item.to) ? theme.palette.accent?.main || theme.palette.primary.light : 'white',
                        'textTransform': 'none',
                        'fontWeight': isActive(item.to) ? 600 : 500,
                        'fontSize': '0.875rem',
                        '&:hover': {
                            color: theme.palette.accent?.main || theme.palette.primary.light,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    {item.label}
                </Button>
            ))}
        </Box>
    );
}
