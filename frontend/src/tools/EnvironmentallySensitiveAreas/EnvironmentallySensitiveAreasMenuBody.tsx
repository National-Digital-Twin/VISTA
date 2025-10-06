import { useCallback, useEffect, useRef } from 'react';
import { EnvironmentallySensitiveAreasLayerId, layers } from './environmentally-sensitive-areas-layers';
import { useEnvironmentallySensitiveAreasSharedStore } from './useStore';
import useLayer from '@/hooks/useLayer';
import MenuItemRow from '@/components/MenuItemRow';

export interface EnvironmentallySensitiveAreasMenuBodyProps {
    readonly searchQuery?: string;
    readonly updateSelectedCount?: (isSelected: boolean) => void;
}

export function EnvironmentallySensitiveAreasMenuBody({ searchQuery = '', updateSelectedCount }: Readonly<EnvironmentallySensitiveAreasMenuBodyProps>) {
    const { enabled, toggle } = useLayer('environmentally-sensitive-areas');

    const enabledLayers = useEnvironmentallySensitiveAreasSharedStore((state) => state.environmentallySensitiveAreasEnabledLayers);
    const toggleLayer = useEnvironmentallySensitiveAreasSharedStore((state) => state.toggleEnvironmentallySensitiveAreasLayer);

    // Track whether the component has mounted to prevent double increment
    const hasMounted = useRef(false);

    // Notify parent about the initial state when the component mounts
    useEffect(() => {
        if (updateSelectedCount && !hasMounted.current) {
            const anyLayerEnabled = Object.values(enabledLayers).some(Boolean);
            if (anyLayerEnabled) {
                updateSelectedCount(true); // Notify parent only if any layer is enabled
            }
            hasMounted.current = true; // Mark as mounted
        }
    }, [enabledLayers, updateSelectedCount]);

    const handleClick = useCallback(
        (layerId: EnvironmentallySensitiveAreasLayerId) => {
            if (!enabled) {
                toggle();
            }
            toggleLayer(layerId);

            if (updateSelectedCount) {
                const isLayerEnabled = !enabledLayers[layerId]; // Determine the new state of the layer
                updateSelectedCount(isLayerEnabled); // Notify parent about the new state
            }
        },
        [enabled, toggle, toggleLayer, enabledLayers, updateSelectedCount],
    );

    return (
        <>
            {(Object.keys(layers) as EnvironmentallySensitiveAreasLayerId[]).map((layerId) => (
                <MenuItemRow
                    key={layerId}
                    primaryText={layers[layerId].name}
                    checked={!!enabledLayers[layerId]}
                    onChange={() => handleClick(layerId)}
                    searchQuery={searchQuery}
                    terms={[layers[layerId].name]}
                />
            ))}
        </>
    );
}
