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
  readonly searchQuery?: string;
}

export function RoadRouteMenuBody({ searchQuery }: RoadRouteMenuBodyProps) {
  const { enabled, toggle } = useLayer("road-route");

  const {
    startPosition,
    endPosition,
    setStartPosition,
    setEndPosition,
    vehicleType,
    setVehicleType,
  } = useRoadRouteSharedStore();

  // ✅ FIX: Ensure this function doesn't cause infinite re-renders
  const handleSelectPosition = useCallback(
    (position: LngLat | null, setPosition: (pos: LngLat | null) => void) => {
      if (!enabled) {
        toggle(); // ⚠️ Make sure `toggle` doesn’t cause unnecessary updates
      }
      setPosition(position);
    },
    [enabled, toggle],
  );

  const handleSelectVehicleType = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as VehicleType;
      if (["HGV", "EmergencyVehicle", "Car"].includes(value)) {
        setVehicleType(value);
      }
    },
    [setVehicleType],
  );

  // ✅ FIX: Memoize marker handlers to prevent unnecessary re-renders
  const {
    startAddMarker: addStartMarker,
    abortMousePositioning: abortAddStartMarker,
    isSelectingPosition: isSelectingStartPosition,
  } = useAddMarker({
    onSelectMarkerPosition: useCallback(
      (pos) => handleSelectPosition(pos, setStartPosition),
      [handleSelectPosition, setStartPosition],
    ),
  });

  const {
    startAddMarker: addEndMarker,
    abortMousePositioning: abortAddEndMarker,
    isSelectingPosition: isSelectingEndPosition,
  } = useAddMarker({
    onSelectMarkerPosition: useCallback(
      (pos) => handleSelectPosition(pos, setEndPosition),
      [handleSelectPosition, setEndPosition],
    ),
  });

  // ✅ FIX: Only run this effect when absolutely necessary
  useEffect(() => {
    if (featureFlags.routing && !enabled) {
      abortAddStartMarker();
      abortAddEndMarker();
    }
  }, [enabled, featureFlags.routing, abortAddStartMarker, abortAddEndMarker]);

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
      {enabled && (
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
          <MenuButton
            onClick={
              !isSelectingStartPosition ? addStartMarker : abortAddStartMarker
            }
            selected={isSelectingStartPosition}
            label={
              isSelectingStartPosition
                ? "Choose the start location on the map (click here to cancel)"
                : "Select Start Location"
            }
          />
          {startPosition && (
            <MenuButton
              onClick={() => handleSelectPosition(null, setStartPosition)}
              selected={false}
              label="Delete Start Position"
            />
          )}
          {startPosition && (
            <>
              <MenuButton
                onClick={
                  !isSelectingEndPosition ? addEndMarker : abortAddEndMarker
                }
                selected={isSelectingEndPosition}
                label={
                  isSelectingEndPosition
                    ? "Choose the end location on the map (click here to cancel)"
                    : "Select End Location"
                }
              />
              {endPosition && (
                <MenuButton
                  onClick={() => handleSelectPosition(null, setEndPosition)}
                  selected={false}
                  label="Delete End Position"
                />
              )}
            </>
          )}
        </>
      )}
    </SearchConditional>
  );
}
