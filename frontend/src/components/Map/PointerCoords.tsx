import { Box, Typography } from "@mui/material";

export interface PointerCoordinatesProps {
  /** Whether the coördinates should be shown */
  readonly show: boolean;

  /** Decimal latitude */
  readonly lat: number;
  /** Decimal longitude */
  readonly lng: number;
}

export default function PointerCoordinates({
  show,
  lat,
  lng,
}: PointerCoordinatesProps) {
  if (!show || (!lat && !lng)) {
    return null;
  }
  return (
    <Box
      sx={{
        display: "flex",
        alignContent: "end",
        gap: "2px",
        position: "absolute",
        width: "100%",
        bottom: "0",
        backgroundColor: "background.paper",
      }}
    >
      <Box className="uppercase border w-fit px-2">lat, lng</Box>
      <Typography className="text-xs">
        {lat}, {lng}
      </Typography>
    </Box>
  );
}
