import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import "react-tabs/style/react-tabs.css";

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
    {
      name: "Layers",
      icon: <LayersOutlinedIcon />,
      content: <LayersControlPanel />,
    },
    {
      name: "Asset Details",
      icon: <InfoOutlinedIcon />,
      content: (
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
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "#f0f2f2",
            borderRadius: 2,
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons="auto"
            slotProps={{
              indicator: {
                component: "div",
                className: "MuiTabs-indicator",
                children: (
                  <Typography
                    component="span"
                    className="MuiTabs-indicatorSpan"
                  ></Typography>
                ),
              },
            }}
            sx={{
              display: "flex",
              justifyContent: "center",

              "& .Mui-selected": {
                color: "#3670b3",
              },

              "& .MuiTabs-indicator": {
                display: "flex",
                justifyContent: "center",
                backgroundColor: "transparent",
                height: "3px",
              },
              "& .MuiTabs-indicatorSpan": {
                maxWidth: "25%",
                width: "100% !important",
                backgroundColor: "#3670b3",
                borderRadius: "5px 5px 0 0",
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
                      paddingTop: 0,
                    }}
                  >
                    <Typography
                      sx={{ textTransform: "none", fontWeight: "bold" }}
                    >
                      {entry.name}
                    </Typography>
                  </Box>
                }
                {...a11yProps(index)}
                sx={{ flexBasis: "50%" }}
                icon={entry.icon}
              ></Tab>
            ))}
          </Tabs>
        </Box>
        <Box sx={{ flexGrow: 1, maxHeight: "100%", overflowY: "auto" }}>
          {tabs.map((entry, i) => (
            <TabPanel key={entry.name} index={i} value={value}>
              <Suspense fallback="Loading...">{entry.content}</Suspense>
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
