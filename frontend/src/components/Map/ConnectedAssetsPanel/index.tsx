import { Box, Button, Grid2, Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import Dependents from "@/tools/AssetDetails/InfoPanel/SelectedElements/Dependents";
import Providers from "@/tools/AssetDetails/InfoPanel/SelectedElements/Providers";
import { a11yProps, TabPanel } from "@/utils/tabHelpers";
import useProviders from "@/hooks/queries/useProviders";

interface ConnectAssetPanelProps {
  connectedAssetData: any;
  hideConnectedAssets: () => void;
}

const ConnectedAssetsPanel = ({
  connectedAssetData,
  hideConnectedAssets,
}: ConnectAssetPanelProps) => {
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const {
    isLoading: isProvidersLoading,
    isError: isProvidersFetchError,
    error: providersFetchError,
    data: providers,
  } = useProviders(
    connectedAssetData.isAsset,
    connectedAssetData.isDependency,
    connectedAssetData.assetUri,
    connectedAssetData.provider,
  );

  const totalProviders = providers?.length || 0;

  return (
    <Box
      sx={{
        width: "100%",
        height: "70vh",
        maxHeight: "70vh",
        position: "relative",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          flexShrink: 0,
        }}
      >
        <Grid2 container>
          <Grid2 size={11}>
            <Typography variant="h5" fontWeight={800}>
              {connectedAssetData.title}
            </Typography>
          </Grid2>
          <Grid2 size={1} sx={{ textAlign: "right" }}>
            <Button
              onClick={() => {
                hideConnectedAssets();
              }}
            >
              X
            </Button>
          </Grid2>
        </Grid2>
      </Box>
      <Box
        sx={{
          p: 2,
        }}
      >
        <Typography variant="body1">{connectedAssetData.id}</Typography>
        <Typography variant="body1" sx={{ backgroundColor: "#f0f0f0" }}>
          {connectedAssetData.type}
        </Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 0,
          overflowY: "scroll",
          p: 2,
        }}
      >
        <Box sx={{}}>
          <Tabs
            sx={{}}
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons={true}
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
            <Tab
              label={`Dependant Assets (${connectedAssetData?.dependent?.count}) `}
              {...a11yProps(0)}
              sx={{ flexBasis: "50%" }}
            />
            <Tab
              label={`Provider Assets (${totalProviders}) `}
              {...a11yProps(1)}
              sx={{ flexBasis: "50%" }}
            />
          </Tabs>
          <TabPanel value={value} index={0}>
            <Dependents
              assetUri={connectedAssetData.assetUri}
              dependent={connectedAssetData.dependant}
              isAsset={connectedAssetData.isAsset}
              isDependency={connectedAssetData.isDependency}
            />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Providers
              isLoading={isProvidersLoading}
              isError={isProvidersFetchError}
              error={providersFetchError}
              providers={providers}
            />
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default ConnectedAssetsPanel;
