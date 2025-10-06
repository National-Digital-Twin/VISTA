import type { Feature, Polygon, Position } from 'geojson';
import createStore from './createStore';

interface DynamicProximityFeatureProperties {
    isCircle: true;
    center: Position;
    radiusInKm: number;
}

export interface State {
    selectedAssetTypes: Record<any, boolean>;

    showPrimary: boolean;
    showSecondary: boolean;
    showLiveFloods: boolean;
    minCriticality: number;
    selectedFloodAreas: NonNullable<Feature['id']>[];
    floodAreaFeatures: Feature[];
    drawnFeatures: Feature<Polygon>[];
    selectedFloodAreaFeatureIds: Record<NonNullable<Feature['id']>, boolean>;

    selectAssetType: (assetType: any) => void;
    deselectAssetType: (assetType: any) => void;

    toggleShowPrimary: () => void;
    toggleShowSecondary: () => void;
    toggleShowLiveFloods: () => void;

    setMinCriticality: (criticality: number) => void;

    setSelectedFloodAreas: (floodAreas: NonNullable<Feature['id']>[]) => void;
    addFloodAreaFeatures: (features: Feature[]) => void;
    updateFloodAreaFeatures: (features: Feature[]) => void;
    deleteFloodAreaFeatures: (featureIds: NonNullable<Feature['id']>[]) => void;
    toggleFloodAreaFeature: (featureId: NonNullable<Feature['id']>) => void;
    setFloodAreaFeatures: (features: Feature[]) => void;

    dynamicProximityFeatures: Feature<Polygon, DynamicProximityFeatureProperties>[];
    addDynamicProximityFeatures: (features: Feature<Polygon, DynamicProximityFeatureProperties>[]) => void;
    updateDynamicProximityFeatures: (features: Feature<Polygon, DynamicProximityFeatureProperties>[]) => void;
    deleteDynamicProximityFeatures: (features: NonNullable<Feature['id']>[]) => void;

    showCpsIconsForAssetTypes: boolean;
    toggleShowCpsIconsForAssetTypes: () => void;
}

type SetFunction = (partial: State | Partial<State> | ((state: State) => State | Partial<State>), replace?: boolean | undefined) => void;

function addFeatures<
    T extends Feature,
    Key extends keyof {
        [K in keyof State as State[K] extends Feature[] ? K : never]: any;
    },
>(key: Key, set: SetFunction) {
    return (features: T[]) =>
        set((state) => ({
            [key]: [...state[key], ...features],
        }));
}

function updateFeatures<
    T extends Feature,
    Key extends keyof {
        [K in keyof State as State[K] extends Feature[] ? K : never]: any;
    },
>(key: Key, set: SetFunction) {
    return (features: T[]) =>
        set((state) => {
            const featureMap = new Map(features.map((feature) => [feature.id, feature]));

            return {
                [key]: state[key].map((f) => (featureMap.has(f.id) ? { ...f, ...featureMap.get(f.id) } : f)),
            };
        });
}
function deleteFeatures<
    T extends Feature,
    Key extends keyof {
        [K in keyof State as State[K] extends Feature[] ? K : never]: any;
    },
>(key: Key, set: SetFunction) {
    return (featureIds: NonNullable<T['id']>[]) =>
        set((state) => ({
            [key]: state[key].filter((f) => f.id && !featureIds.includes(f.id)),
        }));
}

export default createStore<State>('application-state-storage', (set) => ({
    selectedAssetTypes: {},
    deselectAssetType: (assetType) =>
        set((state) => {
            const { [assetType]: _assetType, ...selectedAssetTypes } = state.selectedAssetTypes;
            return { selectedAssetTypes };
        }),
    selectAssetType: (assetType) =>
        set((state) => ({
            selectedAssetTypes: {
                ...state.selectedAssetTypes,
                [assetType]: true,
            },
        })),
    showPrimary: true,
    toggleShowPrimary: () => set((state) => ({ showPrimary: !state.showPrimary })),
    showSecondary: false,
    toggleShowSecondary: () => set((state) => ({ showSecondary: !state.showSecondary })),
    showLiveFloods: false,
    toggleShowLiveFloods: () => set((state) => ({ showLiveFloods: !state.showLiveFloods })),
    minCriticality: 0,
    setMinCriticality: (criticality) => set(() => ({ minCriticality: criticality })),
    selectedFloodAreas: [],
    setSelectedFloodAreas: (floodAreas) => set(() => ({ selectedFloodAreas: floodAreas })),
    drawnFeatures: [],
    floodAreaFeatures: [],
    addFloodAreaFeatures: (features) =>
        set((state) => ({
            floodAreaFeatures: [...state.floodAreaFeatures, ...features],
            selectedFloodAreaFeatureIds: {
                ...state.selectedFloodAreaFeatureIds,
                ...Object.fromEntries(features.map(({ id }) => [id, true])),
            },
        })),
    updateFloodAreaFeatures: updateFeatures('floodAreaFeatures', set),
    deleteFloodAreaFeatures: (featureIds) =>
        set((state) => {
            return {
                floodAreaFeatures: state.floodAreaFeatures.filter((f) => f.id && !featureIds.includes(f.id)),
                selectedFloodAreaFeatureIds: Object.fromEntries(
                    Object.entries(state.selectedFloodAreaFeatureIds).filter(([featureId]) => !featureIds.includes(featureId)),
                ),
            };
        }),
    selectedFloodAreaFeatureIds: {},
    toggleFloodAreaFeature: (featureId) =>
        set((state) => ({
            selectedFloodAreaFeatureIds: {
                ...state.selectedFloodAreaFeatureIds,
                [featureId]: !state.selectedFloodAreaFeatureIds[featureId],
            },
        })),
    setFloodAreaFeatures: (features) => set(() => ({ floodAreaFeatures: features })),
    showCpsIconsForAssetTypes: false,
    toggleShowCpsIconsForAssetTypes: () =>
        set((state) => ({
            showCpsIconsForAssetTypes: !state.showCpsIconsForAssetTypes,
        })),

    /**
     * Dynamic Proximity
     */
    dynamicProximityFeatures: [],
    addDynamicProximityFeatures: addFeatures('dynamicProximityFeatures', set),
    updateDynamicProximityFeatures: updateFeatures('dynamicProximityFeatures', set),
    deleteDynamicProximityFeatures: deleteFeatures('dynamicProximityFeatures', set),
}));
