import { AppBar, Toolbar, Grid2 } from "@mui/material";

/** Overall header of the application */

const PageHeader = ({ appName }) => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#002244" }}>
      <Toolbar>
        <Grid2 container alignItems="center">
          {/* Logo on the far left */}
          <Grid2>
            <img
              src="/logo.svg"
              alt={`${appName} Logo`}
              style={{ width: 200, height: 75 }}
            />
          </Grid2>
        </Grid2>
      </Toolbar>
    </AppBar>
  );
};

export default PageHeader;
