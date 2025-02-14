import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  withStyles,
} from "@material-ui/core";

const styles = (theme) => ({
  appBar: {
    backgroundColor: "#333333", // Custom background color for AppBar
  },
  logo: {
    width: 40,
    height: 40,
  },
  text: {
    color: "#ffffff", // Custom text color
    marginLeft: theme.spacing(1), // Adds space between logo and text
  },
});

const PageHeader = ({ classes }) => {
  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Grid container alignItems="center">
          {/* Logo on the far left */}
          <Grid item>
            <img
              src="path-to-your-logo.png"
              alt="Logo"
              className={classes.logo}
            />
          </Grid>

          {/* Text next to logo */}
          <Grid item>
            <Typography variant="h6" className={classes.text}>
              Your Text Here
            </Typography>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

// Export the component with styles applied
export default withStyles(styles)(PageHeader);
