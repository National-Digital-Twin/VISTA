import { EnvironmentallySensitiveAreasLayerId, layers } from './environmentally-sensitive-areas-layers';
import createStore from '@/hooks/createStore';

interface EnvironmentallySensitiveAreasState {
    environmentallySensitiveAreasEnabledLayers: Partial<Record<EnvironmentallySensitiveAreasLayerId, boolean>>;

    toggleEnvironmentallySensitiveAreasLayer: (layerId: EnvironmentallySensitiveAreasLayerId) => void;
}

export const useEnvironmentallySensitiveAreasSharedStore = createStore<EnvironmentallySensitiveAreasState>('environmentally-sensitive-areas', (set) => ({
    environmentallySensitiveAreasEnabledLayers: Object.fromEntries(Object.keys(layers).map((layer) => [layer, false] as const)) as Record<
        EnvironmentallySensitiveAreasLayerId,
        boolean
    >,

    toggleEnvironmentallySensitiveAreasLayer: (layerName) =>
        set((state) => ({
            environmentallySensitiveAreasEnabledLayers: {
                ...state.environmentallySensitiveAreasEnabledLayers,
                [layerName]: !state.environmentallySensitiveAreasEnabledLayers[layerName],
            },
        })),
}));
