import { useCallback } from "react";
import {
  EnvironmentallySensitiveAreasLayerId,
  layers,
} from "./environmentally-sensitive-areas-layers";
import { useEnvironmentallySensitiveAreasSharedStore } from "./useStore";
import useLayer from "@/hooks/useLayer";
import { MenuButton } from "@/components/MenuButton";

export interface EnvironmentallySensitiveAreasMenuBodyProps {
  searchQuery?: string;
}

export function EnvironmentallySensitiveAreasMenuBody({
  searchQuery = "",
}: EnvironmentallySensitiveAreasMenuBodyProps) {
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
          <MenuButton
            key={layerId}
            onClick={() => handleClick(layerId)}
            selected={!!enabledLayers[layerId]}
            label={layers[layerId].name}
            searchQuery={searchQuery}
          />
        ),
      )}
    </>
  );
}
