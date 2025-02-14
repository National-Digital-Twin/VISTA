import React from "react";
import { AppBar, Toolbar, Grid, withStyles } from "@material-ui/core";

const styles = (theme) => ({
  appBar: {
    backgroundColor: "#002244", // Custom background color for AppBar
  },
  logo: {
    width: 200,
    height: 100,
  },
  text: {
    color: "#f0f2f2", // Custom text color
  },
});

const PageHeader = ({ appName, classes }) => {
  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Grid container alignItems="center">
          {/* Logo on the far left */}
          <Grid item>
            <img src="/logo.svg" alt="Logo" className={classes.logo} />
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

// Export the component with styles applied
export default withStyles(styles)(PageHeader);
