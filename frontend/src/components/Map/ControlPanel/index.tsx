import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "react-tabs/style/react-tabs.css";
import { faLayerGroup, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import React, { Suspense } from "react";
import Typography from "@mui/material/Typography";
import ConnectedAssetsPanel from "../ConnectedAssetsPanel";
import { AssetDetailControlPanel } from "@/tools/AssetDetails";
import { LayersControlPanel } from "@/tools/LayersControlPanel";
import { a11yProps, TabPanel } from "@/utils/tabHelpers";

interface ControlPanelProps {
  readonly connectedAssetsPanelOpen: boolean;
  readonly hideConnectedAssets: () => void;
  readonly showConnectedAssets: () => void;
}

/** Main control panel, for controlling layers and simulation */
export default function ControlPanel({
  connectedAssetsPanelOpen,
  hideConnectedAssets,
  showConnectedAssets,
}: ControlPanelProps) {
  const [value, setValue] = React.useState(0);

  const [connectedAssetData, setConnectedAssetData] = React.useState<any>(null);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = [
    { name: "Layers", icon: faLayerGroup, Content: <LayersControlPanel /> },
    {
      name: "Asset Details",
      icon: faCircleInfo,
      Content: (
        <AssetDetailControlPanel
          showConnectedAssets={showConnectedAssets}
          setConnectedAssetData={setConnectedAssetData}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        gap: 0,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "background.paper",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          boxShadow: 4,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", borderRadius: 2 }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="layers and asset details"
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
        <Box sx={{ flexGrow: 1, maxHeight: "100%", overflowY: "auto" }}>
          {tabs.map((entry, i) => (
            <TabPanel key={entry.name} index={i} value={value}>
              <Suspense fallback="Loading...">{entry.Content}</Suspense>
            </TabPanel>
          ))}
        </Box>
      </Box>
      {connectedAssetsPanelOpen && (
        <ConnectedAssetsPanel
          connectedAssetData={connectedAssetData}
          hideConnectedAssets={hideConnectedAssets}
        />
      )}
    </Box>
  );
}
