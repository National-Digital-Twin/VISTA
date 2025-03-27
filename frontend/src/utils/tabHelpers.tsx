import { Box } from "@mui/material";
import React from "react";
export function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  containerPadding?: number;
}

export function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, containerPadding, ...other } = props;

  return (
    <Box
      sx={{
        maxHeight: "100%",
        height: "100%",
      }}
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            maxHeight: "100%",
            overflowY: "auto",
          }}
          padding={containerPadding ?? 3}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
