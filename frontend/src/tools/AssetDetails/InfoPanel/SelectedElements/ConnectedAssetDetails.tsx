import { capitalCase } from "change-case";
import { Box, Typography } from "@mui/material";
import styles from "./elements.module.css";
import { getURIFragment } from "@/utils";

export interface ConnectedAssetDetailsProps {
  /** Connected asset error, if any */
  readonly error?: Error;
  /** Asset URI */
  readonly uri: string;
  /** Canonical asset name */
  readonly name: string;
  /** Asset type */
  readonly type: string;
  /** Asset criticality */
  readonly criticality?: number;
  /** Connection strength, which is apparently different from criticality */
  readonly connectionStrength?: number;
}

export default function ConnectedAssetDetails({
  error,
  uri,
  name,
  type,
  criticality,
  connectionStrength,
}: ConnectedAssetDetailsProps) {
  if (error) {
    return <li className={styles.errorMessage}>{error.message}</li>;
  }

  return (
    <li className={styles.connectedAssetDetails}>
      <Box className={styles.connectedAssetHeader}>
        <Box>
          <Typography
            variant="h3"
            fontWeight="fontWeightBold"
            sx={{ fontSize: "14pt" }}
          >
            {name || uri}
          </Typography>
          <Typography
            className={styles.connectedAssetUri}
            fontWeight="fontWeightRegular"
            sx={{ fontSize: "12pt" }}
          >
            {uri.split("#")[1]}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Box sx={{ display: "flex" }}>
          <Typography
            variant="body1"
            fontWeight="fontWeightLight"
            sx={{ width: "40%", fontSize: "12pt", color: "#727781" }}
          >
            Type:
          </Typography>
          <Typography
            variant="body1"
            fontWeight="fontWeightRegular"
            sx={{ width: "60%", fontSize: "12pt" }}
          >
            {capitalCase(getURIFragment(type))}
          </Typography>
        </Box>
        <Box sx={{ display: "flex" }}>
          <Typography
            variant="body1"
            fontWeight="fontWeightLight"
            sx={{ width: "40%", fontSize: "12pt", color: "#727781" }}
          >
            Criticality:
          </Typography>
          <Typography
            variant="body1"
            fontWeight="fontWeightRegular"
            sx={{ width: "60%", fontSize: "12pt" }}
          >
            {criticality ?? "N/D"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex" }}>
          <Typography
            variant="body1"
            fontWeight="fontWeightLight"
            sx={{ width: "40%", fontSize: "12pt", color: "#727781" }}
          >
            Connection Strength:
          </Typography>
          <Typography
            variant="body1"
            fontWeight="fontWeightRegular"
            sx={{ width: "60%", fontSize: "12pt" }}
          >
            {connectionStrength ?? "N/D"}
          </Typography>
        </Box>
      </Box>
    </li>
  );
}
