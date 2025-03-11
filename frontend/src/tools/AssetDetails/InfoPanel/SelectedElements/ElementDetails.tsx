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
    <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 2, p: 1 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {/* Asset Title */}
          <Box>
            <Typography variant="h6">
              {details.title || "Asset Details"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {element?.uri || "N/A"}
            </Typography>
          </Box>

          {/* Asset Type */}
          {details?.type && (
            <Box display="flex" alignItems="center" ml={1}>
              <TypeIcon size="sm" type={details.type} />
            </Box>
          )}
        </Box>

        {/* View Connected Assets - Expands Panel */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={1}
          onClick={() => {
            showConnectedAssets();
          }}
          sx={{ cursor: "pointer" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            View connected assets
          </Typography>
          <ArrowRightIcon fontSize="small" sx={{ ml: 1 }} />
        </Box>

        {/* Google Street View Section */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={1}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
