import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Divider,
} from "@mui/material";

const LegendContent: React.FC = () => {
  return (
    <Card sx={{ border: 0, boxShadow: 0 }}>
      <CardContent sx={{ border: 0, padding: 0, boxShadow: 0 }}>
        {/* Title */}
        <Typography variant="h6" fontWeight="bold">
          Legend
        </Typography>

        {/* Subtitle */}
        <Typography variant="subtitle1" fontWeight="bold">
          Road Criticality
        </Typography>

        <Divider sx={{ my: 1 }} />

        {/* Legend Items */}
        <List dense>
          <ListItem>
            <div
              style={{
                width: 16,
                height: 4,
                backgroundColor: "#35C035",
                marginRight: 8,
              }}
            />
            <Typography variant="body2">Low</Typography>
          </ListItem>

          <ListItem>
            <div
              style={{
                width: 16,
                height: 4,
                backgroundColor: "#FFB60A",
                marginRight: 8,
              }}
            />
            <Typography variant="body2">Medium</Typography>
          </ListItem>

          <ListItem>
            <div
              style={{
                width: 16,
                height: 4,
                backgroundColor: "#FB3737",
                marginRight: 8,
              }}
            />
            <Typography variant="body2">High</Typography>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

export default LegendContent;
