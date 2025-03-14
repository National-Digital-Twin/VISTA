import { useRef } from "react";
import { useBoolean, useDarkMode, useOnClickOutside } from "usehooks-ts";
import { Box, Switch, Typography } from "@mui/material";
import styles from "./style.module.css";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import {
  useShowPointerCoords,
  useTogglePointerCoords,
} from "@/context/ShowPointerCoords";
import useSharedStore from "@/hooks/useSharedStore";

interface ToggleSwitchControlMenuItem {
  name: string;
  selected: boolean;
  onItemClick: () => void;
}

interface ButtonControlMenuItem {
  readonly name: string;
  readonly onItemClick: () => void;
}

type ControlMenuItem = ToggleSwitchControlMenuItem | ButtonControlMenuItem;

export default function MapSettingsButton() {
  const ref = useRef<HTMLDivElement>(null);

  const {
    value: showSettingsMenu,
    toggle: toggleSettingsMenu,
    setFalse: hideSettingsMenu,
  } = useBoolean(false);

  useOnClickOutside(ref, hideSettingsMenu);

  const { enable: enableDarkMode, disable: disableDarkMode } = useDarkMode();

  const showPointerCoords = useShowPointerCoords();
  const togglePointerCoords = useTogglePointerCoords();

  const { showCpsIconsForAssetTypes, toggleShowCpsIconsForAssetTypes } =
    useSharedStore();

  const mapTools: ControlMenuItem[] = [
    {
      name: "Coordinates",
      selected: showPointerCoords,
      type: "toggleSwitch",
      onItemClick: togglePointerCoords,
    },
    {
      name: "Show CPS icons",
      selected: showCpsIconsForAssetTypes,
      type: "toggleSwitch",
      onItemClick: toggleShowCpsIconsForAssetTypes,
    },
  ];

  return (
    <div ref={ref} className="pointer-events-auto">
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
          <Box display="flex" alignItems="center" mb={1}>
            <Switch
              onChange={(event) => {
                if (event.target.checked) {
                  enableDarkMode();
                } else {
                  disableDarkMode();
                }
              }}
            />
            <Typography sx={{ ml: 1 }}>Dark Mode</Typography>
          </Box>
          {mapTools.map((tool) => {
            return (
              <ButtonControl
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
    </div>
  );
}

type ButtonControlProps = ButtonControlMenuItem;

function ButtonControl({ name, onItemClick }: ButtonControlProps) {
  return (
    <Box display="flex" alignItems="center" mb={1}>
      <Switch onChange={onItemClick} />
      <Typography sx={{ ml: 1 }}>{name}</Typography>
    </Box>
  );
}
