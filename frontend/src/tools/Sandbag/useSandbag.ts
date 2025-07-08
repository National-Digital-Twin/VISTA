import { useCallback, useEffect } from "react";
import { MarkerDragEvent } from "react-map-gl/maplibre";
import useStore from "./useStore";
import {
  SandbagPlacement,
  useGetSandbagPlacements,
  useUpdateSandbagPlacement,
  useDeleteSandbagPlacement,
} from "@/api/paralog-python";

export const useEditSandbags = () => {
  const selectedPlacement = useStore((state) => state.selectedPlacement);
  const setSelectedPlacement = useStore((state) => state.setSelectedPlacement);

  const [executeQuery, query] = useGetSandbagPlacements();

  const [updateSandbag] = useUpdateSandbagPlacement();

  const [deleteSandbag] = useDeleteSandbagPlacement();

  const handleDragEnd = async (
    { lngLat: { lat: latitude, lng: longitude } }: MarkerDragEvent,
    { name, id }: SandbagPlacement,
  ) => {
    await updateSandbag({
      variables: { input: { name, longitude, latitude } },
      optimisticResponse: {
        updateSandbagPlacement: {
          __typename: "MutateSandbagPlacementResult",
          errors: [],
          success: true,
          sandbagPlacement: {
            __typename: "SandbagPlacement",
            id,
            name,
            latitude,
            longitude,
          },
        },
      },
    });
  };

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      switch (event.key) {
        case "Delete":
        case "Backspace":
          if (selectedPlacement) {
            await deleteSandbag({
              variables: { name: selectedPlacement.name },
            });
            setSelectedPlacement(null);
          }
          break;
        default:
          break;
      }
    },
    [deleteSandbag, selectedPlacement, setSelectedPlacement],
  );

  const handleMarkerClick = useCallback(
    (item: SandbagPlacement) => {
      setSelectedPlacement(item);
    },
    [setSelectedPlacement],
  );

  useEffect(
    function deregisterEvents() {
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [handleKeyDown],
  );

  return {
    executeQuery,
    query,
    onMarkerDragEnd: handleDragEnd,
    onMarkerClick: handleMarkerClick,
  };
};
