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
import React from "react";

/** Overall header of the application */

const PageHeader = ({ appName }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
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
            <MenuItem disabled>test@ndtp.co.uk</MenuItem>
            <Divider component="li" />
            <MenuItem onClick={handleClose} sx={{ paddingLeft: "10px" }}>
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
