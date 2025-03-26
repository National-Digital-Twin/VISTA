import { capitalCase } from "change-case";
import { Box, Grid2, Typography } from "@mui/material";
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
          <Typography variant="body1" fontWeight={900}>
            {name || uri}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {uri.split("#")[1]}
          </Typography>
        </Box>
      </Box>

      <Grid2 container spacing={2}>
        <Grid2 size={4}>
          <Typography variant="body1">Type:</Typography>
        </Grid2>
        <Grid2 size={8}>
          <Typography variant="body1">
            {capitalCase(getURIFragment(type))}
          </Typography>
        </Grid2>
        <Grid2 size={4}>
          <Typography variant="body1">Criticality:</Typography>
        </Grid2>
        <Grid2 size={8}>
          <Typography variant="body1">{criticality ?? "N/D"}</Typography>
        </Grid2>
        <Grid2 size={4}>
          <Typography variant="body1">Connection Strength:</Typography>
        </Grid2>
        <Grid2 size={8}>
          <Typography variant="body1">{connectionStrength ?? "N/D"}</Typography>
        </Grid2>
      </Grid2>
    </li>
  );
}
