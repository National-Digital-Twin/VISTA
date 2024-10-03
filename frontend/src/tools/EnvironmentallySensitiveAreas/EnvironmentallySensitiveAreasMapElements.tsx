import { useEnvironmentallySensitiveAreasSharedStore } from "./useStore";
import { EnvironmentallySensitiveAreasLayer } from "./EnvironmentallySensitiveAreasLayer";
import useLayer from "@/hooks/useLayer";

export default function EnvironmentallySensitiveAreasMapElements() {
  const { enabled } = useLayer("environmentally-sensitive-areas");

  const enabledLayers = useEnvironmentallySensitiveAreasSharedStore(
    (state) => state.environmentallySensitiveAreasEnabledLayers,
  );

  if (!enabled) {
    return null;
  }

  return (
    <>
      {Object.entries(enabledLayers)
        .filter<[keyof typeof enabledLayers, boolean]>(
          (value): value is [keyof typeof enabledLayers, boolean] => !!value[1],
        )
        .map(([layerId]) => (
          <EnvironmentallySensitiveAreasLayer key={layerId} layerId={layerId} />
        ))}
    </>
  );
}
