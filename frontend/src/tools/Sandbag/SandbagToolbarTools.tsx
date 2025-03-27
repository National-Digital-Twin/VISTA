import { MouseEvent, useCallback, useState } from "react";
import { Box, Button, Menu, MenuItem, Paper, Typography } from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { useAddMarker } from "../NewMarker/useAddMarker";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import {
  useCreateSandbagPlacement,
  useGetSandbagPlacements,
} from "@/api/paralog-python";

export default function SandbagToggle() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { enabled } = useLayer("sandbag");

  const mousePosition = useStore((state) => state.mousePosition);

  const [, { data }] = useGetSandbagPlacements();

  const [createSandbag] = useCreateSandbagPlacement();

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const { startAddMarker } = useAddMarker({
    onSelectMarkerPosition: useCallback(
      async ({ lat: latitude, lng: longitude }) => {
        while (true) {
          const name = prompt("Enter the name for the new sandbag placement:");
          if (!name) {
            return;
          }
          if (data?.sandbagPlacements.map((item) => item.name).includes(name)) {
            alert(
              "A sandbag placement with that name already exists. Please try a different name.",
            );
          } else {
            await createSandbag({
              variables: { input: { name, latitude, longitude } },
            });
            return;
          }
        }
      },
      [data?.sandbagPlacements, createSandbag],
    ),
  });

  const handleClick = () => {
    closeMenu();
    startAddMarker();
  };

  if (featureFlags.uiNext && !enabled) {
    return null;
  }

  return (
    <Box
      component={Paper}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginLeft: "10px",
      }}
    >
      <Button
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={openMenu}
        endIcon={<ExpandMoreOutlinedIcon />}
        sx={{ textTransform: "none", color: "black" }}
      >
        <Typography variant="body1">Sandbags</Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open && enabled && !mousePosition}
        onClose={closeMenu}
        sx={{
          "& .MuiPaper-root": {
            marginTop: "15px",
          },
        }}
      >
        <MenuItem onClick={handleClick}>
          <Typography variant="body1">Add new sandbag</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
