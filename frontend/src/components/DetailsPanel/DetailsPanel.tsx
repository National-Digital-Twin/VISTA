import React from "react";
import { Card, CardContent, IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

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
        height: "25vh",
        maxHeight: "22vh",
        overflow: "hidden",
        position: "relative",
        transition: "height 0.3s ease",
        borderRadius: 2,
        boxShadow: 3,
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
          <FontAwesomeIcon icon={faChevronDown} size="lg" />
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
