import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

interface NotificationsProps {
    readonly unseenCount?: number;
    readonly onClick?: () => void;
}

export default function Notifications({ unseenCount = 0, onClick }: NotificationsProps) {
    const theme = useTheme();
    const location = useLocation();
    const isOnNotificationsPage = location.pathname === '/notifications';

    return (
        <Tooltip title="Notifications">
            <IconButton
                onClick={onClick}
                sx={{
                    '&:hover': {
                        color: theme.palette.accent?.main || theme.palette.primary.light,
                    },
                }}
                aria-label="notifications"
            >
                <Badge
                    badgeContent={isOnNotificationsPage ? 0 : unseenCount}
                    color="error"
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            height: '18px',
                            minWidth: '18px',
                        },
                    }}
                >
                    {isOnNotificationsPage ? (
                        <NotificationsIcon
                            sx={{
                                color: theme.palette.accent?.main || theme.palette.primary.light,
                            }}
                        />
                    ) : (
                        <NotificationsOutlinedIcon
                            sx={{
                                color: 'white',
                            }}
                        />
                    )}
                </Badge>
            </IconButton>
        </Tooltip>
    );
}
