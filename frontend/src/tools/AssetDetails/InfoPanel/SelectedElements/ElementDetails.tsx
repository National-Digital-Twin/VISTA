import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room"; // Google Maps Pin Icon
import ArrowRightIcon from "@mui/icons-material/ArrowRight"; // Import ArrowRightIcon
import TypeIcon from "./TypeIcon";
import { fetchAssetInfo } from "@/api/combined";
import { getURIFragment, isAsset, isDependency } from "@/utils";
import { isEmpty } from "@/utils/isEmpty";

export interface ElementDefaultsProps {
  readonly element: any;
  showConnectedAssets: () => void;
  setConnectedAssetData: (data: any) => void;
}

export default function ElementDetails({
  element,
  showConnectedAssets,
  setConnectedAssetData,
}: Readonly<ElementDefaultsProps>) {
  const elemIsAsset = isAsset(element);

  const assetInfo = useQuery({
    enabled: elemIsAsset,
    queryKey: ["asset-info", element?.uri || ""],
    queryFn: () => fetchAssetInfo(element?.uri || ""),
  });

  const isLoading = assetInfo.isLoading;
  const isError = assetInfo.isError;

  useEffect(() => {
    if (elemIsAsset && assetInfo.data) {
      const details = element?.getDetails?.(assetInfo.data) || {};
      setConnectedAssetData(constructElementDetailsObject(element, details));
    }
  }, [elemIsAsset, assetInfo.data, element, setConnectedAssetData]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error fetching details for {element?.uri || "this asset"}
      </Alert>
    );
  }

  let details = undefined;
  if (elemIsAsset) {
    details = element?.getDetails?.(assetInfo.data) || {};
  }

  if (isEmpty(element) || !details) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Unable to retrieve details for this element.
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 1, p: 0.5 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="start"
          gap={2}
        >
          {/* Left Column - Asset Title & Type (Left Aligned) */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {details.title || "Asset Details"}
            </Typography>
          </Box>

          {/* Right Column - View Connected Assets & Google Street View */}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-end"
            sx={{ minWidth: 200 }}
          >
            {/* View Connected Assets */}
            <Box
              display="flex"
              alignItems="center"
              sx={{ cursor: "pointer", mb: 1, whiteSpace: "nowrap" }}
              onClick={() => showConnectedAssets()}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                View connected assets
              </Typography>
              <ArrowRightIcon fontSize="small" sx={{ ml: 1 }} />
            </Box>

            {/* Google Street View */}
            <Box display="flex" alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                Google Street View
              </Typography>
              <Tooltip title="Open Google Street View">
                <IconButton
                  component="a"
                  href={`https://www.google.com/maps?q=${element?.uri}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <RoomIcon sx={{ color: "#4285F4" }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function constructElementDetailsObject(element: any, details: any) {
  console.log("constructElementDetailsObject", element);
  return {
    dependent: element?.dependent || {},
    assetUri: element?.uri || "",
    isAsset: isAsset(element),
    isDependency: isDependency(element),
    provider: element?.provider || {},
    title: details.title,
    id: details.id,
    type: getURIFragment(details.type || "#Unknown"),
  };
}
