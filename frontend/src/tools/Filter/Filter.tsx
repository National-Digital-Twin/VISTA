import { useContext, useCallback, useState, useEffect } from "react";
import { Box, Card, CardContent, Slider, Typography } from "@mui/material";
import MaterialUISwitch from "../../components/Switch";
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
        <Box sx={{ paddingTop: 0, display: "flex", width: "100%" }}>
          <Box sx={{ display: "flex", maxWidth: "45%", marginRight: "10px" }}>
            <Card
              sx={{
                boxShadow: 4,
                marginLeft: 2,
                height: "6vh",
                maxHeight: 75,
                marginBottom: 1,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "100%",
                  padding: 0,

                  "&.MuiCardContent-root:last-child": {
                    paddingBottom: 0,
                  },
                }}
              >
                <Box sx={{ display: "flex" }}>
                  <Box
                    sx={{
                      display: "flex",
                      borderRight: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ marginLeft: "10px" }}
                    >
                      <Typography>Primary Assets</Typography>
                      <MaterialUISwitch
                        checked={showPrimary}
                        onChange={toggleShowPrimary}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex" }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ marginLeft: "10px" }}
                    >
                      <Typography>Dependent Assets</Typography>
                      <MaterialUISwitch
                        checked={showSecondary}
                        onChange={toggleShowSecondary}
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ display: "flex", width: "55%" }}>
            {(showPrimary || showSecondary) && (
              <Card
                sx={{
                  boxShadow: 4,
                  marginRight: 2,
                  overflow: "visible",
                  position: "relative",
                  maxHeight: 75,
                  height: "6vh",
                  marginBottom: 1,
                  width: "100%",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    height: "100%",
                  }}
                >
                  <CriticalitySlider />
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
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
