// import React from "react";
import { Typography, Box } from "@mui/material";
import styles from "./style.module.css";

interface FloodRiskAreasProps {
  readonly atRiskAreas: any[];
}

export default function FloodRiskAreas({ atRiskAreas }: FloodRiskAreasProps) {
  if (!atRiskAreas.length) {
    return <Typography>No current flood warnings</Typography>;
  }

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ marginTop: 0, marginBottom: 2, fontWeight: "400" }}
      >
        Active flood warnings
      </Typography>
      {atRiskAreas.map((area) => {
        const {
          name,
          value: currentLevel,
          trend,
          percentile_5,
          percentile_95,
          river,
          value_date,
          direction,
          river_name,
        } = area.properties;

        return (
          <div key={name} className={styles.floodRiskArea}>
            <Typography
              variant="body2"
              sx={{ marginTop: 0, marginBottom: 2, fontWeight: "bold" }}
            >
              {name || "Unnamed Area"}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
              River: {river || river_name || "Unknown"}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
              Current Level:{" "}
              {currentLevel !== null ? currentLevel.toFixed(2) : "Unknown"}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
              Trend: {trend || "Unknown"} (
              {direction === "u" ? "Upstream" : "Downstream"})
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
              Last updated:{" "}
              {value_date ? new Date(value_date).toLocaleString() : "Unknown"}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
              Normal range:{" "}
              {percentile_5 !== null ? percentile_5.toFixed(2) : "Unknown"} -{" "}
              {percentile_95 !== null ? percentile_95.toFixed(2) : "Unknown"}
            </Typography>
          </div>
        );
      })}
    </Box>
  );
}
