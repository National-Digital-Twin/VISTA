import { AppBar, Toolbar } from "@mui/material";
import { Box } from "@mui/system";

/** Overall header of the application */

const PageHeader = ({ appName }) => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#002244" }}>
      <Toolbar>
        <Box alignItems="center">
          {/* Logo on the far left */}
          <Box>
            <img
              src="/logo.svg"
              alt={`${appName} Logo`}
              style={{ width: 200, height: 75 }}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PageHeader;
