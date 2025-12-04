import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import { signout } from '@/api/auth';
import { useUserData } from '@/hooks/useUserData';

type UserMenuProps = {
    readonly onMyProfileClick?: () => void;
    readonly onAdminSettingsClick?: () => void;
    readonly onPrivacyClick?: () => void;
};

export default function UserMenu({ onMyProfileClick, onAdminSettingsClick, onPrivacyClick }: UserMenuProps) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { getUserDisplayName, getUserEmailDomain, loading } = useUserData();

    const open = Boolean(anchorEl);

    const handleAccountClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = () => {
        signout();
        handleClose();
    };

    const handlePrivacyNotice = () => {
        onPrivacyClick?.();
        handleClose();
    };

    const handleMyProfile = () => {
        onMyProfileClick?.();
        handleClose();
    };

    const handleAdminSettings = () => {
        onAdminSettingsClick?.();
        handleClose();
    };

    return (
        <>
            <IconButton
                onClick={handleAccountClick}
                sx={{
                    '&:hover': {
                        color: theme.palette.accent?.main || theme.palette.primary.light,
                    },
                }}
                aria-controls={open ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                {anchorEl ? (
                    <AccountCircleIcon
                        sx={{
                            color: theme.palette.accent?.main || theme.palette.primary.light,
                        }}
                    />
                ) : (
                    <AccountCircleOutlinedIcon sx={{ color: 'white' }} />
                )}
            </IconButton>

            <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{ paper: { sx: { minWidth: 200, padding: '4px' } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem disabled dense sx={{ '&.Mui-disabled': { opacity: 1 } }}>
                    <Typography variant="body2" fontWeight="bold">
                        {loading ? 'Loading...' : getUserDisplayName()}
                    </Typography>
                </MenuItem>
                <MenuItem disabled dense sx={{ '&.Mui-disabled': { opacity: 1 } }}>
                    <Typography variant="body2" color="secondary">
                        {loading ? 'Loading...' : getUserEmailDomain()}
                    </Typography>
                </MenuItem>

                <Divider component="li" />

                <MenuItem onClick={handleMyProfile}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                        }}
                    >
                        <PersonOutlineIcon fontSize="small" />
                        <Typography variant="body2">My Profile</Typography>
                    </Box>
                </MenuItem>

                <MenuItem onClick={handleAdminSettings}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                        }}
                    >
                        <SettingsOutlinedIcon fontSize="small" />
                        <Typography variant="body2">Admin Settings</Typography>
                    </Box>
                </MenuItem>

                <MenuItem onClick={handlePrivacyNotice}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                        }}
                    >
                        <LockOutlinedIcon fontSize="small" />
                        <Typography variant="body2">Privacy notice</Typography>
                    </Box>
                </MenuItem>

                <Divider component="li" />

                <MenuItem onClick={handleSignOut}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                        }}
                    >
                        <LogoutOutlinedIcon fontSize="small" />
                        <Typography variant="body2">Sign Out</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </>
    );
}
