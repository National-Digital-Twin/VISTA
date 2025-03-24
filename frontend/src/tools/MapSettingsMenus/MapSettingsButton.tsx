import { useRef } from "react";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import { Box, Typography } from "@mui/material";
import styles from "./style.module.css";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import {
  useShowPointerCoords,
  useTogglePointerCoords,
} from "@/context/ShowPointerCoords";
import useSharedStore from "@/hooks/useSharedStore";
import MaterialUISwitch from "@/components/Switch";

interface ToggleSwitchControlMenuItem {
  name: string;
  checked: boolean;
  onItemClick: () => void;
}

export default function MapSettingsButton() {
  const ref = useRef<HTMLDivElement>(null);

  const {
    value: showSettingsMenu,
    toggle: toggleSettingsMenu,
    setFalse: hideSettingsMenu,
  } = useBoolean(false);

  useOnClickOutside(ref, hideSettingsMenu);

  const showPointerCoords = useShowPointerCoords();
  const togglePointerCoords = useTogglePointerCoords();

  const { showCpsIconsForAssetTypes, toggleShowCpsIconsForAssetTypes } =
    useSharedStore();

  const mapTools: ToggleSwitchControlMenuItem[] = [
    {
      name: "Coordinates",
      checked: showPointerCoords,
      onItemClick: togglePointerCoords,
    },
    {
      name: "Show CPS icons",
      checked: showCpsIconsForAssetTypes,
      onItemClick: toggleShowCpsIconsForAssetTypes,
    },
  ];

  return (
    <Box
      ref={ref}
      sx={{ display: "flex", justifyContent: "end", pointerEvents: "auto" }}
    >
      {showSettingsMenu && (
        <Box
          className={styles.menu}
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          {mapTools.map((tool) => {
            return (
              <ToggleSwitchControl
                key={tool.name}
                {...tool}
                onItemClick={() => {
                  tool.onItemClick();
                }}
              />
            );
          })}
        </Box>
      )}
      <ToolbarButton
        title="Settings menu"
        onClick={toggleSettingsMenu}
        svgSrc="icons/Settings.svg"
      />
    </Box>
  );
}

function ToggleSwitchControl({
  name,
  onItemClick,
  checked,
}: ToggleSwitchControlMenuItem) {
  return (
    <Box display="flex" alignItems="center" mb={1}>
      <MaterialUISwitch onChange={onItemClick} checked={checked} />
      <Typography sx={{ ml: 1 }}>{name}</Typography>
    </Box>
  );
}
