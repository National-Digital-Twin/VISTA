import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface RadiusDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (radius: number) => void;
}

export default function RadiusDialog({
  open,
  onClose,
  onConfirm,
}: RadiusDialogProps) {
  const [radius, setRadius] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRadius(value);

    const numValue = parseFloat(value);
    if (value === "") {
      setError("");
    } else if (isNaN(numValue) || numValue <= 0) {
      setError("Please enter a valid positive number");
    } else {
      setError("");
    }
  };

  const handleConfirm = () => {
    const numRadius = parseFloat(radius);
    if (!isNaN(numRadius) && numRadius > 0) {
      onConfirm(numRadius);
      setRadius("");
      setError("");
      onClose();
    }
  };

  const handleCancel = () => {
    setRadius("");
    setError("");
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !error && radius !== "") {
      handleConfirm();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="radius-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="radius-dialog-title">
        Enter circle radius
        <IconButton
          aria-label="close"
          onClick={handleCancel}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Radius (km)"
            value={radius}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            error={!!error}
            helperText={error ?? "Enter the radius of the circle in kilometers"}
            variant="outlined"
            type="number"
            inputProps={{
              step: "0.1",
              min: "0.1",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={!!error || radius === ""}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
