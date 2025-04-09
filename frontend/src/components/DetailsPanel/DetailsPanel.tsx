import React from "react";
import { Card, CardContent, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface DetailsPanelProps {
  readonly children: React.ReactNode;
  readonly onClose?: () => void;
  readonly isOpen: boolean;
}

export default function DetailsPanel({
  children,
  onClose,
  isOpen,
}: DetailsPanelProps) {
  return (
    <Card
      sx={{
        overflow: "hidden",
        position: "relative",
        transition: "height 0.3s ease",
        borderRadius: 2,
        boxShadow: 4,
        width: "100%",
        flex: "1 0 auto",
      }}
      data-expanded={isOpen}
    >
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: "3rem" }} />
        </IconButton>
      )}
      <CardContent
        sx={{
          height: "100%",
          overflowY: "auto",
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
