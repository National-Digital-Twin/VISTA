import { useRef, useMemo } from "react";
import { useBoolean, useOnClickOutside } from "usehooks-ts";
import {
  Box,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
} from "@mui/material";
import styles from "./style.module.css";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useMapStyles } from "@/components/Map/mapStyles";
import { useMapStyleKey, useSetMapStyleKey } from "@/context/MapStyle";

export default function MapStyleButton() {
  const ref = useRef<HTMLDivElement>(null);
  const {
    value: showMapStyles,
    toggle: toggleMapStyleMenu,
    setFalse: hideMapStyleMenu,
  } = useBoolean(false);

  useOnClickOutside(ref, hideMapStyleMenu);

  const mapStyles = useMapStyles();
  const mapStyleKey = useMapStyleKey();
  const setMapStyleKey = useSetMapStyleKey();

  const mapMenuItems = useMemo(
    () =>
      mapStyles.map(({ name, key }) => ({
        name: name,
        key: key,
        selected: key === mapStyleKey,
        type: "radio",
        onItemClick: () => {
          setMapStyleKey(key);
        },
      })),
    [mapStyles, mapStyleKey, setMapStyleKey],
  );

  return (
    <Box
      sx={{ display: "flex", justifyContent: "end", pointerEvents: "auto" }}
      ref={ref}
    >
      {showMapStyles && (
        <Box
          className={styles.menu}
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            boxShadow: 4,
          }}
        >
          <FormControl component="fieldset">
            <FormLabel component="legend">Map Styles</FormLabel>
            <RadioGroup
              aria-label="map styles"
              name="map-styles"
              value={mapStyleKey}
              onChange={(event) => setMapStyleKey(event.target.value)}
            >
              {mapMenuItems.map((item) => (
                <FormControlLabel
                  key={item.name}
                  value={item.key}
                  control={<Radio />}
                  label={item.name}
                  onClick={item.onItemClick}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      )}
      <ToolbarButton
        title="Map style menu"
        onClick={toggleMapStyleMenu}
        svgSrc="/icons/Stacks.svg"
      />
    </Box>
  );
}
