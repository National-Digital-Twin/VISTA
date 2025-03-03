import React, { useState } from "react";
import { Card, CardContent, Typography, List, ListItem, Divider, Button } from "@mui/material";

const LegendContent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <Card sx={{ minWidth: 250, boxShadow: 3, borderRadius: 2, position: "absolute", top: 20, right: 20 }}>
      <CardContent>
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
            <div style={{ width: 16, height: 4, backgroundColor: "#35C035", marginRight: 8 }} />
            <Typography variant="body2">Low</Typography>
          </ListItem>

          <ListItem>
            <div style={{ width: 16, height: 4, backgroundColor: "#FFB60A", marginRight: 8 }} />
            <Typography variant="body2">Medium</Typography>
          </ListItem>

          <ListItem>
            <div style={{ width: 16, height: 4, backgroundColor: "#FB3737", marginRight: 8 }} />
            <Typography variant="body2">High</Typography>
          </ListItem>
        </List>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="text"
            color="primary"
            sx={{ textTransform: "none" }} 
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegendContent;
