import { useContext, useCallback, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid2,
  Slider,
  Switch,
  Typography,
} from "@mui/material";
import useSharedStore from "@/hooks/useSharedStore";
import useFloodWatchAreas from "@/hooks/queries/flood-areas/useFloodWatchAreas";
import { ElementsContext } from "@/context/ElementContext";

export default function Filter() {
  const showSecondary = useSharedStore((state) => state.showSecondary);
  const toggleShowSecondary = useSharedStore(
    (state) => state.toggleShowSecondary,
  );
  const showPrimary = useSharedStore((state) => state.showPrimary);
  const toggleShowPrimary = useSharedStore((state) => state.toggleShowPrimary);
  const selectedFloodAreas = useSharedStore(
    (state) => state.selectedFloodAreas,
  );
  const drawnFeatures = useSharedStore((state) => state.floodAreaFeatures);
  const { isError: isErrorFloodAreas } = useFloodWatchAreas();

  const showFloodAreaControls =
    selectedFloodAreas?.length > 0 || drawnFeatures?.length > 0;

  if (isErrorFloodAreas) {
    return null;
  }

  return (
    <>
      {showFloodAreaControls && (
        <Grid2
          direction={"row"}
          container
          gap={4}
          sx={{ paddingTop: 0 }}
          size={12}
        >
          <Grid2 size={5}>
            <Card sx={{ boxShadow: 3, marginLeft: 2 }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPrimary}
                      onChange={toggleShowPrimary}
                    />
                  }
                  label="Primary Assets"
                />
                <Divider orientation="vertical" flexItem sx={{ marginX: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showSecondary}
                      onChange={toggleShowSecondary}
                    />
                  }
                  label="Dependent Assets"
                />
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 size={6}>
            <Card
              sx={{
                boxShadow: 3,
                marginRight: 2,
                height: "100%",
                overflow: "visible",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible",
                }}
              >
                {(showPrimary || showSecondary) && <CriticalitySlider />}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      )}
    </>
  );
}

function CriticalitySlider() {
  const setMinCriticality = useSharedStore((state) => state.setMinCriticality);
  const minCriticality = useSharedStore((state) => state.minCriticality);
  const { assetCriticalities } = useContext(ElementsContext);
  const [sliderValue, setSliderValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    const currentValue = Math.max(
      0,
      assetCriticalities.indexOf(minCriticality),
    );
    setSliderValue(currentValue);
    setMaxValue(Math.max(0, assetCriticalities.length - 1));
  }, [minCriticality, assetCriticalities]);

  const handleChange = useCallback(
    (event: Event, value: number | number[]) => {
      if (!assetCriticalities.length) {
        return;
      }
      const index = value as number;
      const newValue = assetCriticalities[index];
      setMinCriticality(newValue);
    },
    [assetCriticalities, setMinCriticality],
  );

  return (
    <>
      <Typography id="criticality-slider" sx={{ marginX: 2, marginTop: 0.5 }}>
        Criticality
      </Typography>
      <Slider
        sx={{
          marginRight: 2,
          marginTop: 0.5,
          overflow: "visible",
          position: "relative",
          "& .MuiSlider-rail": {
            backgroundColor: "#F2F0EF",
            height: 20,
            borderRadius: 20,
          },
          "& .MuiSlider-track": {
            backgroundColor: "#002244",
            height: 20,
            borderRadius: 20,
          },
          "& .MuiSlider-mark": {
            backgroundColor: "#002244",
            height: 5,
            width: 5,
            borderRadius: 10,
          },
          "& .MuiSlider-markActive": { backgroundColor: "white", fontSize: 12 },
          "& .MuiSlider-thumb": {
            backgroundColor: "white",
            width: 20,
            height: 20,
            borderRadius: 0,
            position: "relative",

            "&::before": {
              content: "''",
              position: "absolute",
              width: 5,
              height: 55,
              backgroundColor: "#002244",
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: 2,
            },
            "&.Mui-active": {
              backgroundColor: "blue",
            },
            "&::after": {
              content: `"${sliderValue}"`,
              position: "absolute",
              top: 40,
              left: "50%",
              transform: "translateX(-50%)",
              color: "black",
              fontSize: 12,
              backgroundColor: "white",
              fontWeight: "bold",
              padding: "5px 8px",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.3)",
              visibility: "hidden",
            },

            "&.Mui-active::after": {
              visibility: "visible",
            },
          },
        }}
        value={sliderValue}
        onChange={handleChange}
        min={0}
        max={maxValue}
        step={1}
        marks
        aria-labelledby="criticality-slider"
      />
    </>
  );
}
