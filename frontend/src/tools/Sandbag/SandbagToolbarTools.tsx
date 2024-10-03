import { useCallback } from "react";
import { useAddMarker } from "../NewMarker/useAddMarker";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import ToolbarDropdown from "@/components/ToolbarDropdown";
import {
  useCreateSandbagPlacement,
  useGetSandbagPlacements,
} from "@/api/paralog-python";

export default function SandbagToggle() {
  const { enabled, toggle } = useLayer("sandbag");

  const mousePosition = useStore((state) => state.mousePosition);

  const [, { data }] = useGetSandbagPlacements();

  const [createSandbag] = useCreateSandbagPlacement();

  const { startAddMarker } = useAddMarker({
    onSelectMarkerPosition: useCallback(
      async ({ lat: latitude, lng: longitude }) => {
        while (true) {
          const name = prompt("Enter the name for the new sandbag placement:");
          if (!name) {
            return;
          }
          if (data?.sandbagPlacements.map((item) => item.name).includes(name)) {
            alert(
              "A sandbag placement with that name already exists. Please try a different name.",
            );
          } else {
            await createSandbag({
              variables: { input: { name, latitude, longitude } },
            });
            return;
          }
        }
      },
      [data?.sandbagPlacements, createSandbag],
    ),
  });

  if (featureFlags.uiNext && !enabled) {
    return null;
  }

  return (
    <ToolbarDropdown title="Sandbags" large>
      {!featureFlags.uiNext && (
        <button className="menu-item" role="menuitem" onClick={toggle}>
          {enabled ? "Hide" : "Show"} Sandbags
        </button>
      )}
      {enabled && !mousePosition ? (
        <button className="menu-item" role="menuitem" onClick={startAddMarker}>
          Add new sandbag
        </button>
      ) : null}
    </ToolbarDropdown>
  );
}
