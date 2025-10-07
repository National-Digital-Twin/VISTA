import { useCallback, useDebugValue } from 'react';
import createStore from './createStore';

interface State {
    layers: string[];

    enableLayer: (layerName: string) => void;
    disableLayer: (layerName: string) => void;
    toggleLayer: (layerName: string) => void;
}

export const useLayerStore = createStore<State>('layers', (set) => ({
    layers: [],

    enableLayer(layerName: string) {
        set((state) => {
            if (!state.layers.includes(layerName)) {
                return {
                    layers: [...state.layers, layerName],
                };
            }
        });
    },

    disableLayer(layerName: string) {
        set((state) => {
            if (state.layers.includes(layerName)) {
                return {
                    layers: state.layers.filter((activeLayer) => activeLayer !== layerName),
                };
            }
        });
    },

    toggleLayer(layerName: string) {
        set((state) => {
            if (state.layers.includes(layerName)) {
                return {
                    layers: state.layers.filter((activeLayer) => activeLayer !== layerName),
                };
            } else {
                return {
                    layers: [...state.layers, layerName],
                };
            }
        });
    },
}));

export default function useLayer(layerName: string) {
    const layers = useLayerStore((store) => store.layers);
    const enableLayer = useLayerStore((store) => store.enableLayer);
    const disableLayer = useLayerStore((store) => store.disableLayer);
    const toggleLayer = useLayerStore((store) => store.toggleLayer);

    const enableThisLayer = useCallback(() => enableLayer(layerName), [enableLayer, layerName]);
    const disableThisLayer = useCallback(() => disableLayer(layerName), [disableLayer, layerName]);
    const toggleThisLayer = useCallback(() => toggleLayer(layerName), [toggleLayer, layerName]);

    const isEnabled = layers.includes(layerName);

    useDebugValue(isEnabled ? `${layerName} ENABLED` : `${layerName} DISABLED`);

    return {
        enabled: isEnabled,
        enable: enableThisLayer,
        disable: disableThisLayer,
        toggle: toggleThisLayer,
    };
}
