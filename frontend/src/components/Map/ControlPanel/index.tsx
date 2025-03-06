import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "react-tabs/style/react-tabs.css";

import React, { Suspense } from "react";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import Typography from "@mui/material/Typography";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";

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

export interface ControlPanelProps {
  /** Additional class name to attach to the top-level element */
  readonly className?: string;
  /** Action to close the control panel */
  readonly onClose?: () => void;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

/** Main control panel, for controlling layers and simulation */
export default function ControlPanel({ onClose }: ControlPanelProps) {
  const tools = useTools();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const entries = tools("control-panel-order")
    .map((tool) => {
      if (!tool.controlPanelTab || !tool.ControlPanelContent) {
        return null;
      }
      return {
        name: tool.controlPanelTab.title,
        icon: tool.controlPanelTab.icon,
        Content: tool.ControlPanelContent,
      };
    })
    .filter(Boolean); // Removes null values safely

  return (
    <Box
      sx={{
        width: "100%",
        height: "90vh",
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
          {entries.map((entry, index) => (
            <Tab
              key={entry.name}
              label={
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {entry.icon && (
                    <FontAwesomeIcon
                      className="inline mb-1"
                      icon={entry.icon}
                    />
                  )}
                  <Typography variant="body2">{entry.name}</Typography>
                </Box>
              }
              {...a11yProps(index)}
              sx={{ flexBasis: "50%" }}
            ></Tab>
          ))}
        </Tabs>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        {entries.map((entry, i) => (
          <TabPanel key={entry.name} index={i} value={value}>
            <Suspense fallback="Loading...">
              <entry.Content />
            </Suspense>
          </TabPanel>
        ))}
      </Box>
      {onClose && <ControlPanelCloseButton onClose={onClose} />}
    </Box>
  );
}

interface ControlPanelCloseButtonProps {
  readonly onClose: () => void;
}

function ControlPanelCloseButton({ onClose }: ControlPanelCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      title="Close control panel"
      className={styles.controlPanelCloseButton}
    >
      <FontAwesomeIcon icon={faClose} />
    </button>
  );
}
