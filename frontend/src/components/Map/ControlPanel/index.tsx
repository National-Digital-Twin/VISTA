import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "react-tabs/style/react-tabs.css";
import { faLayerGroup, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import React, { Suspense } from "react";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import { AssetDetailControlPanel } from "@/tools/AssetDetails";
import { LayersControlPanel } from "@/tools/LayersControlPanel";

// move this to the child tab panels
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, ...other } = props;

  return (
    <div
      style={{
        maxHeight: "100%",
        overflow: "auto",
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
            p: 3,
            maxHeight: "100%",
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

interface ControlPanelProps {
  dependantPanelOpen: boolean;
  hideDependantPanel: () => void;
  showDependantPanel: () => void;
}

/** Main control panel, for controlling layers and simulation */
export default function ControlPanel({
  dependantPanelOpen,
  hideDependantPanel,
  showDependantPanel,
}: ControlPanelProps) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = [
    { name: "Layers", icon: faLayerGroup, Content: <LayersControlPanel /> },
    {
      name: "Asset Details",
      icon: faCircleInfo,
      Content: (
        <AssetDetailControlPanel showDependantPanel={showDependantPanel} />
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",

        gap: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "70vh",
          position: "relative",
          backgroundColor: "background.paper",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                display: "flex",
                justifyContent: "center",
                "& .MuiTabs-indicator": {
                  width: "fit-content",
                },
              },
            }}
          >
            {tabs.map((entry, index) => (
              <Tab
                key={entry.name}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      paddingTop: 2,
                    }}
                  >
                    {entry.icon && (
                      <FontAwesomeIcon
                        className="inline mb-1"
                        icon={entry.icon}
                        size="2x"
                      />
                    )}
                    <Typography
                      sx={{ textTransform: "none", fontWeight: "bold" }}
                    >
                      {entry.name}
                    </Typography>
                  </Box>
                }
                {...a11yProps(index)}
                sx={{ flexBasis: "50%" }}
              ></Tab>
            ))}
          </Tabs>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
          {tabs.map((entry, i) => (
            <TabPanel key={entry.name} index={i} value={value}>
              <Suspense fallback="Loading...">{entry.Content}</Suspense>
            </TabPanel>
          ))}
        </Box>
      </Box>
      {dependantPanelOpen && (
        <Box
          sx={{
            width: "100%",
            height: "70vh",
            position: "relative",
            backgroundColor: "background.paper",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6">Control Panel</Typography>
          <Button
            onClick={() => {
              hideDependantPanel();
            }}
          >
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
}
