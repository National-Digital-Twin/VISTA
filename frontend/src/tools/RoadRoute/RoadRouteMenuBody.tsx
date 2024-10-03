import { useCallback, useEffect, useId } from "react";
import type { ChangeEvent } from "react";
import { LngLat } from "maplibre-gl";
import { useAddMarker } from "../NewMarker/useAddMarker";
import { useRoadRouteSharedStore, VehicleType } from "./useStore";
import useLayer from "@/hooks/useLayer";
import { MenuButton } from "@/components/MenuButton";
import featureFlags from "@/config/feature-flags";
import SearchConditional from "@/components/SearchConditional";

export interface RoadRouteMenuBodyProps {
  searchQuery?: string;
}

export function RoadRouteMenuBody({ searchQuery }: RoadRouteMenuBodyProps) {
  const { enabled, toggle } = useLayer("road-route");

  const startPosition = useRoadRouteSharedStore((state) => state.startPosition);
  const endPosition = useRoadRouteSharedStore((state) => state.endPosition);

  const setStartPosition = useRoadRouteSharedStore(
    (state) => state.setStartPosition,
  );
  const setEndPosition = useRoadRouteSharedStore(
    (state) => state.setEndPosition,
  );

  const vehicleType = useRoadRouteSharedStore((state) => state.vehicleType);
  const setVehicleType = useRoadRouteSharedStore(
    (state) => state.setVehicleType,
  );

  const handleSelectStartPosition = useCallback(
    (position: LngLat | null) => {
      if (!enabled) {
        toggle();
      }

      setStartPosition(position);
    },
    [setStartPosition, enabled, toggle],
  );

  const handleSelectEndPosition = useCallback(
    (position: LngLat | null) => {
      if (!enabled) {
        toggle();
      }

      setEndPosition(position);
    },
    [setEndPosition, enabled, toggle],
  );

  const handleSelectVehicleType = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (["HGV", "EmergencyVehicle", "Car"].includes(event.target.value)) {
        setVehicleType(event.target.value as VehicleType);
      }
    },
    [setVehicleType],
  );

  const {
    startAddMarker: addStartMarker,
    abortMousePositioning: abortAddStartMarker,
    isSelectingPosition: isSelectingStartPosition,
  } = useAddMarker({
    onSelectMarkerPosition: handleSelectStartPosition,
  });

  const {
    startAddMarker: addEndMarker,
    abortMousePositioning: abortAddEndMarker,
    isSelectingPosition: isSelectingEndPosition,
  } = useAddMarker({
    onSelectMarkerPosition: handleSelectEndPosition,
  });

  useEffect(
    function endMarkerPositioningWhenLayerIsDisabled() {
      if (!featureFlags.routing) {
        return;
      }

      if (!enabled) {
        abortAddStartMarker();
        abortAddEndMarker();
      }
    },
    [enabled, abortAddEndMarker, abortAddStartMarker],
  );

  const kindDropdownID = useId();

  return (
    <SearchConditional
      searchQuery={searchQuery}
      terms={["road", "route", "vehicle"]}
    >
      <MenuButton
        onClick={toggle}
        selected={false}
        label={enabled ? "Hide Road Route" : "Show Road Route"}
      />
      {enabled ? (
        <>
          <div className="menu-info">
            <label htmlFor={kindDropdownID}>Vehicle type: </label>
            <select
              name={kindDropdownID}
              id={kindDropdownID}
              value={vehicleType}
              onChange={handleSelectVehicleType}
            >
              <option value="HGV">HGVs</option>
              <option value="EmergencyVehicle">Emergency vehicles</option>
              <option value="Car">Cars</option>
            </select>
          </div>
          {!startPosition ? (
            <MenuButton
              onClick={
                !isSelectingStartPosition ? addStartMarker : abortAddStartMarker
              }
              selected={isSelectingStartPosition}
              label={
                isSelectingStartPosition
                  ? "Choose the start location on the map (click here to cancel)"
                  : "Select start location"
              }
            />
          ) : (
            <MenuButton
              onClick={() => handleSelectStartPosition(null)}
              selected={false}
              label="Delete start position"
            />
          )}
          {startPosition && !endPosition ? (
            <MenuButton
              onClick={
                !isSelectingEndPosition ? addEndMarker : abortAddEndMarker
              }
              selected={isSelectingEndPosition}
              label={
                isSelectingEndPosition
                  ? "Choose the end location on the map (click here to cancel)"
                  : "Select end location"
              }
            />
          ) : endPosition ? (
            <MenuButton
              onClick={() => handleSelectEndPosition(null)}
              selected={false}
              label="Delete end position"
            />
          ) : null}
        </>
      ) : null}
    </SearchConditional>
  );
}
