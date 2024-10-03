import React, { useContext, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBuilding } from "@fortawesome/free-solid-svg-icons";
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
        <>
          <button
            className="btn"
            onClick={toggleShowPrimary}
            title={`${showPrimary ? "Hide" : "Show"} assets directly at risk`}
          >
            <FontAwesomeIcon icon={faBolt} className="mr-2" />
            Show Primary Assets
          </button>
          <button
            className="btn"
            onClick={toggleShowSecondary}
            title={`${showSecondary ? "Hide" : "Show"} secondary/dependent assets at risk`}
          >
            <FontAwesomeIcon icon={faBuilding} className="mr-2" />
            Show Dependent Assets
          </button>
          {(showPrimary || showSecondary) && <CriticalitySlider />}
        </>
      )}
    </>
  );
}

function CriticalitySlider() {
  const setMinCriticality = useSharedStore((state) => state.setMinCriticality);
  const minCriticalitity = useSharedStore((state) => state.minCriticality);
  const { assetCriticalities } = useContext(ElementsContext);

  const maxValue = Math.max(0, assetCriticalities.length - 1);
  const currentValue = Math.max(
    0,
    assetCriticalities.indexOf(minCriticalitity),
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!assetCriticalities.length) {
        return 0;
      }
      const index = event.target.value;
      const newValue = assetCriticalities[index];
      setMinCriticality(newValue);
    },
    [assetCriticalities, setMinCriticality],
  );

  return (
    <div className="btn" title="Filter out less critical assets">
      <span className="text-white pr-2">Criticality</span>
      <input
        type="range"
        value={currentValue}
        onChange={handleChange}
        min={0}
        max={maxValue}
        className="criticality-slider"
      />
    </div>
  );
}
