import { useCallback, useEffect, useId } from "react";
import type { ChangeEvent } from "react";
import { LngLat } from "maplibre-gl";
import { useAddMarker } from "../NewMarker/useAddMarker";
import { useRoadRouteSharedStore, VehicleType } from "./useStore";
import useLayer from "@/hooks/useLayer";
import { MenuButton } from "@/components/MenuButton";
import featureFlags from "@/config/feature-flags";
import SearchConditional from "@/components/SearchConditional";
import MenuItemRow from "@/components/MenuItemRow";

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

  useEffect(() => {
    if (featureFlags.routing && !enabled) {
      abortAddStartMarker();
      abortAddEndMarker();
    }
  }, [enabled, abortAddStartMarker, abortAddEndMarker]);

  const kindDropdownID = useId();

  return (
    <SearchConditional
      searchQuery={searchQuery}
      terms={["road", "route", "vehicle"]}
    >
      <MenuItemRow
        searchQuery={searchQuery}
        terms={["road", "route", "vehicle"]}
        primaryText="Route"
        checked={enabled}
        onChange={toggle}
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
