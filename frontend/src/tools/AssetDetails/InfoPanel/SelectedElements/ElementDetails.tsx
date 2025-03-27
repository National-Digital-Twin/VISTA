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
import RoomIcon from "@mui/icons-material/Room";
import { capitalCase } from "change-case";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
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
  setConnectedAssetData,
  showConnectedAssets,
}: Readonly<ElementDefaultsProps>) {
  const elemIsAsset = isAsset(element);

  const assetInfo = useQuery({
    enabled: elemIsAsset,
    queryKey: ["asset-info", element?.uri || ""],
    queryFn: () => fetchAssetInfo(element?.uri || ""),
  });

  const isLoading = assetInfo.isLoading;
  const isError = assetInfo.isError;

  const onClick = () => {
    if (elemIsAsset && assetInfo.data) {
      const details = element?.getDetails?.(assetInfo.data) || {};
      setConnectedAssetData(constructElementDetailsObject(element, details));
      showConnectedAssets();
    }
  };
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
    return null;
  }

  // Extract type string after #
  const extractedType = details.type?.split("#").pop() || "Unknown";

  return (
    <Card sx={{ padding: 0, margin: 0 }} elevation={0}>
      <CardContent sx={{ padding: 1, margin: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          {/* Left Column - Asset Title & Type (Left Aligned) */}
          <Box sx={{ maxWidth: 250 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {details.title || "Asset Details"}
            </Typography>
            <Typography variant="subtitle2">
              {details.id || "Asset Details"}
            </Typography>

            {/* Grey Box for Type */}
            <Box
              sx={{
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                display: "inline-block",
                fontWeight: 500,
                marginTop: "4px",
              }}
            >
              {capitalCase(extractedType)}
            </Box>
          </Box>

          {/* Right Column - View Connected Assets & Google Street View */}
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            {/* View Connected Assets */}
            <Box
              display="flex"
              alignItems="center"
              sx={{ cursor: "pointer", mb: 1, whiteSpace: "nowrap" }}
              onClick={() => {
                onClick();
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                View connected assets
              </Typography>
              <ArrowRightAltIcon fontSize="small" sx={{ ml: 1 }} />
            </Box>

            {/* Google Street View */}
            <Box display="flex" alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                Google Street View
              </Typography>
              {element?.lat && element?.lng ? (
                <Tooltip title="Open Google Street View">
                  <IconButton
                    component="a"
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${element?.lat},${element?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <RoomIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Coordinates not available
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function constructElementDetailsObject(element: any, details: any) {
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
