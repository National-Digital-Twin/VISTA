import { useCallback } from "react";
import {
  EnvironmentallySensitiveAreasLayerId,
  layers,
} from "./environmentally-sensitive-areas-layers";
import { useEnvironmentallySensitiveAreasSharedStore } from "./useStore";
import useLayer from "@/hooks/useLayer";
import MenuItemRow from "@/components/MenuItemRow";

export interface EnvironmentallySensitiveAreasMenuBodyProps {
  readonly searchQuery?: string;
}

export function EnvironmentallySensitiveAreasMenuBody({
  searchQuery = "",
}: Readonly<EnvironmentallySensitiveAreasMenuBodyProps>) {
  const { enabled, toggle } = useLayer("environmentally-sensitive-areas");

  const enabledLayers = useEnvironmentallySensitiveAreasSharedStore(
    (state) => state.environmentallySensitiveAreasEnabledLayers,
  );
  const toggleLayer = useEnvironmentallySensitiveAreasSharedStore(
    (state) => state.toggleEnvironmentallySensitiveAreasLayer,
  );

  const handleClick = useCallback(
    (layerId: EnvironmentallySensitiveAreasLayerId) => {
      if (!enabled) {
        toggle();
      }
      toggleLayer(layerId);
    },
    [enabled, toggle, toggleLayer],
  );

  return (
    <>
      {(Object.keys(layers) as EnvironmentallySensitiveAreasLayerId[]).map(
        (layerId) => (
          <MenuItemRow
            key={layerId}
            primaryText={layers[layerId].name}
            checked={!!enabledLayers[layerId]}
            onChange={() => handleClick(layerId)}
            searchQuery={searchQuery}
            terms={[layers[layerId].name]}
          />
        ),
      )}
    </>
  );
}
