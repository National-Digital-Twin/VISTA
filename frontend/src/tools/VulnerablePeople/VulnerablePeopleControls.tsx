import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useEffect } from "react";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";
import MenuItemRow from "@/components/MenuItemRow";

export default function VulnerablePeopleControls({
  searchQuery = "",
}: Readonly<{
  searchQuery?: string;
}>) {
  const { enabled, toggle } = useLayer("vulnerable-people");

  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      onAddFeatures: state.addVulnerablePeopleFeatures,
      onUpdateFeatures: state.updateVulnerablePeopleFeatures,
      onDeleteFeatures: state.deleteVulnerablePeopleFeatures,
    })),
  );

  const features = useSharedStore(
    useShallow((state) => state.vulnerablePeopleFeatures),
  );

  const setSelected = useStore(
    (state) => state.setSelectedVulnerablePeopleItem,
  );

  const {
    startDrawing,
    features: [drawnFeature],
  } = useDrawingMode(
    (state) => (enabled ? state.vulnerablePeopleFeatures : []),
    drawingModeCallbacks,
  );

  const handleDrawRectangle = useCallback(() => {
    if (!enabled) {
      toggle();
    }
    startDrawing({ drawingMode: "draw_rectangle" });
  }, [startDrawing, enabled, toggle]);

  const handleDeleteArea = useCallback(() => {
    if (!drawnFeature) {
      return;
    }

    if (enabled) {
      toggle();
    }

    setSelected(null);

    drawingModeCallbacks.onDeleteFeatures([drawnFeature.id]);
  }, [drawnFeature, enabled, toggle, setSelected, drawingModeCallbacks]);

  useEffect(
    function turnOnLayerWhenUserDrawsArea() {
      if (!drawnFeature) {
        return;
      }
      if (enabled) {
        return;
      }

      toggle();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger when user adds or changes area
    [drawnFeature],
  );

  if (!featureFlags.vulnerablePeople) {
    return null;
  }

  const buttons = [];

  if (drawnFeature) {
    buttons.push({
      iconSvg: <DeleteOutlineOutlinedIcon />,
      name: "Delete Area",
      onClick: handleDeleteArea,
    });
  }

  if (!drawnFeature && features.length === 0) {
    buttons.push({
      iconSvg: (
        <svg
          width="29"
          height="28"
          viewBox="0 0 29 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="14" cy="4" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
          <circle cx="25" cy="7" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
          <circle cx="19" cy="24" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
          <circle cx="4" cy="13" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
          <path
            d="M6.5 11L11.5 6M17 5.5H22M24 10L20 20.5M6.5 15L16.5 22"
            stroke="#0E142B"
            strokeWidth="1.5"
          />
        </svg>
      ),
      name: "Draw Area",
      onClick: handleDrawRectangle,
    });
  }

  return (
    <MenuItemRow
      primaryText="Vulnerable People Polygon"
      checked={enabled}
      onChange={toggle}
      searchQuery={searchQuery}
      terms={["Vulnerable People", "polygon", "vulnerable"]}
      buttons={buttons}
    />
  );
}
