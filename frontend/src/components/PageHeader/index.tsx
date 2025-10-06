import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import React, { useEffect, useState } from "react";
import config from "@/config/app-config";
import { signout } from "@/utils/signout";

/** Overall header of the application */

const PageHeader = ({
  appName,
  onShowPrivacy,
}: {
  appName: string;
  onShowPrivacy?: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(config.services.user);

        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const json = await res.json();
        setUser(json?.content);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const handleSignOut = () => {
    signout();
    handleClose();
  };

  const handlePrivacyNotice = () => {
    onShowPrivacy?.();
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#002244" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <img
            src="/logo.svg"
            alt={`${appName} Logo`}
            style={{ width: 200, height: 75 }}
          />
        </Box>
        <Box>
          <IconButton
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            {open ? (
              <AccountCircleIcon htmlColor="rgb(255, 207, 6)" />
            ) : (
              <AccountCircleOutlinedIcon htmlColor="#fff" />
            )}
          </IconButton>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem disabled>
              {user?.email ?? (error ? "Error loading user" : "Loading...")}
            </MenuItem>
            <Divider component="li" />
            <MenuItem
              onClick={handlePrivacyNotice}
              sx={{ paddingLeft: "10px" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "start",
                  width: "100%",
                  paddingTop: "2px",
                  paddingBottom: "2px",
                  gap: "8px",
                  color: "#002244",
                }}
              >
                <LockOutlinedIcon sx={{ marginLeft: "-4px" }} />
                <Typography component="span">Privacy notice</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleSignOut} sx={{ paddingLeft: "10px" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "start",
                  width: "100%",
                  paddingTop: "2px",
                  paddingBottom: "2px",
                  gap: "8px",
                  color: "#002244",
                }}
              >
                <LogoutOutlinedIcon sx={{ marginLeft: "-4px" }} />
                <Typography component="span">Sign out</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PageHeader;
