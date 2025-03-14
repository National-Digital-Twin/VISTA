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

const ConnectedAssetsPanel: React.FC<ConnectAssetPanelProps> = ({
  connectedAssetData,
  hideConnectedAssets,
}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const {
    isLoading: isProvidersLoading,
    isError: isProvidersFetchError,
    error: providersFetchError,
    data: providers,
  } = useProviders(
    connectedAssetData?.isAsset ?? false,
    connectedAssetData?.isDependency ?? false,
    connectedAssetData?.assetUri ?? "",
    connectedAssetData?.provider ?? ""
  );

  const totalProviders = providers?.length || 0;
  const totalDependents = connectedAssetData?.dependent?.count || 0;

  return (
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
      <Grid2 container spacing={2} sx={{ p: 2 }}>
        {/* Header Section */}
        <Grid2 size={11}>
          <Typography variant="h5" fontWeight={800}>
            {connectedAssetData?.title || "Unknown Asset"}
          </Typography>
        </Grid2>
        <Grid2 size={1} sx={{ textAlign: "right" }}>
          <Button onClick={hideConnectedAssets}>X</Button>
        </Grid2>

        {/* Asset Info */}
        <Grid2 size={12}>
          <Typography variant="body1">{connectedAssetData?.id || "N/A"}</Typography>
          <Typography variant="body1" sx={{ backgroundColor: "#f0f0f0" }}>
            {connectedAssetData?.type || "Unknown Type"}
          </Typography>
        </Grid2>

        {/* Tabs Section */}
        <Grid2 size={12}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="connected assets tabs"
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
            <Tab
              label={`Dependent Assets (${totalDependents})`}
              {...a11yProps(0)}
              sx={{ flexBasis: "50%" }}
            />
            <Tab
              label={`Provider Assets (${totalProviders})`}
              {...a11yProps(1)}
              sx={{ flexBasis: "50%" }}
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={value} index={0}>
            <Dependents
              assetUri={connectedAssetData?.assetUri}
              dependent={connectedAssetData?.dependent}
              isAsset={connectedAssetData?.isAsset}
              isDependency={connectedAssetData?.isDependency}
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
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default ConnectedAssetsPanel;
