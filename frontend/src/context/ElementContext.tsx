import React, { useCallback, useEffect, useReducer, useState, useMemo } from 'react';
import type ColorScale from 'color-scales';
import type { Feature, Polygon } from 'geojson';

import elementsReducer, {
    ADD_ASSETS,
    ADD_DEPENDENCIES,
    AREA_SELECTION,
    CLEAR_SELECTED,
    DISMISS_ERROR,
    FILTER_SELECTED_ELEMENTS,
    INITIAL_STATE,
    MULTI_SELECT_ELEMENTS,
    REMOVE_ELEMENTS_BY_TYPE,
    RESET,
    SELECT_ELEMENT,
    UPDATE_ERRORS,
} from './elements-reducer';
import useSharedStore from '@/hooks/useSharedStore';
import { useGroupedAssets, useLiveFloodAreas } from '@/hooks';
import useAssetsInPolygons from '@/hooks/useAssetsInPolygons';
import { getUniqueElements } from '@/utils';
import type { Asset, Dependency, Element } from '@/models';

export interface ElementsContextItems {
    /** All assets */
    assets: Asset[];
    /** Asset criticalities */
    assetCriticalities: any[];
    /** Asset dependencies */
    dependencies: Dependency[];
    /** Errors */
    errors: string[];
    /** Selected elements */
    selectedElements: Element[];
    /** Maximum asset total CXNs(?) */
    maxAssetTotalCxns: 0;
    /** Live flood areas */
    liveFloodAreas: Feature<Polygon>[];
    /** Clicked flood areas */
    clickedFloodAreas: Record<string, Feature<Polygon>[]>;
    /** Set the clicked flood areas */
    setClickedFloodAreas: (clickedFloodAreas: Record<string, Feature<Polygon>[]>) => void;
    /** Asset criticality colour scale(?) */
    assetCriticalityColorScale: {};
    /** CXN criticality color scale */
    cxnCriticalityColorScale: ColorScale;
    /** Total CXNs colour scale */
    totalCxnsColorScale: {};
    /** Add elements callback */
    addElements: (assets: Asset[], dependencies: Dependency[]) => void;
    /** Clear selected elements callback */
    clearSelectedElements: () => void;
    /** Dismiss error notification callback */
    dismissErrorNotification: (error: any) => void;
    /** On area select callback */
    onAreaSelect: (area: any) => void;
    /** On element clicked callback */
    onElementClick: (multiSelect: boolean, selectedElements: Element[]) => void;
    /** Reset callback */
    reset: () => void;
    /** Remove elements by type callback */
    removeElementsByType: (typeURI: string) => void;
    /** Update error notifications callback */
    updateErrorNotifications: (message: string) => void;
    /** Timeline which is currently selected */
    selectedTimeline: any;
    /** Close timeline panel callback */
    closeTimelinePanel: () => void;
    /** Select flood timeline callback */
    onFloodTimelineSelect: (timeline: any) => void;
}

export const ElementsContext = React.createContext<ElementsContextItems | null>(null);

export interface ElementsProviderProps {
    /** Children */
    readonly children?: React.ReactNode;
}

/** Provide the "Elements" context */
export function ElementsProvider({ children }: ElementsProviderProps) {
    const [clickedFloodAreas, setClickedFloodAreas] = useState({});

    const [state, dispatch] = useReducer(elementsReducer, INITIAL_STATE);
    const [selectedTimeline, setSelectedTimeline] = useState(null);

    const selectedAssetTypes = useSharedStore((state) => state.selectedAssetTypes);
    const showPrimary = useSharedStore((state) => state.showPrimary);
    const showSecondary = useSharedStore((state) => state.showSecondary);
    const showLiveFloods = useSharedStore((state) => state.showLiveFloods);
    const minCriticality = useSharedStore((state) => state.minCriticality);
    const drawnFloodAreaFeatures = useSharedStore((state) => state.floodAreaFeatures);
    const selectedDrawnFloodAreaFeatureIds = useSharedStore((state) => state.selectedFloodAreaFeatureIds);

    const { getAssetsByTypes, getDependenciesByTypes, isLoadingDependencies, isLoadingAssets } = useGroupedAssets({});

    const { data: liveFloodAreasRaw } = useLiveFloodAreas();

    const liveFloodAreas = useMemo(() => (showLiveFloods ? liveFloodAreasRaw : []), [liveFloodAreasRaw, showLiveFloods]);

    const onFloodTimelineSelect = useCallback(
        (selected) => {
            if (selected !== selectedTimeline) {
                setSelectedTimeline(selected);
            }
        },
        [selectedTimeline],
    );

    const closeTimelinePanel = useCallback(() => {
        setSelectedTimeline(null);
    }, []);

    const { assets, dependencies, errors, selectedElements, maxAssetTotalCxns, assetCriticalityColorScale, cxnCriticalityColorScale, totalCxnsColorScale } =
        state;

    const { findAssetsInPolygons } = useAssetsInPolygons();
    const { getDependentAssets } = useGroupedAssets({});

    const primaryAssetsAtRiskFromDrawn = useMemo(() => {
        if (isLoadingAssets) {
            return [];
        }
        const selectedDrawnFeatures = drawnFloodAreaFeatures.filter((feature) => selectedDrawnFloodAreaFeatureIds[feature.id]);
        return findAssetsInPolygons({
            polygons: selectedDrawnFeatures,
        });
    }, [drawnFloodAreaFeatures, findAssetsInPolygons, isLoadingAssets, selectedDrawnFloodAreaFeatureIds]);

    const cachedAssetsAtRisk = useMemo(() => ({}), []);

    const primaryAssetsAtRiskFromReal = useMemo(() => {
        if (isLoadingAssets) {
            return [];
        }
        const features: any[] = Object.values(clickedFloodAreas).flatMap((p) => p);
        const cacheMisses = Object.fromEntries(
            features
                .filter((feature) => !cachedAssetsAtRisk[feature.properties.FWS_TACODE])
                .map((feature) => [feature.properties.FWS_TACODE, findAssetsInPolygons({ polygons: [feature] })]),
        );
        const newCache = { ...cachedAssetsAtRisk, ...cacheMisses };
        Object.assign(cachedAssetsAtRisk, cacheMisses);
        return features.flatMap((feature) => newCache[feature.properties.FWS_TACODE]);
    }, [isLoadingAssets, clickedFloodAreas, cachedAssetsAtRisk, findAssetsInPolygons]);

    const primaryAssetsAtRiskFromLive = useMemo(() => {
        if (isLoadingAssets) {
            return [];
        }
        return findAssetsInPolygons({ polygons: liveFloodAreas });
    }, [isLoadingAssets, findAssetsInPolygons, liveFloodAreas]);

    const primaryAssetsAtRisk = useMemo(
        () => (primaryAssetsAtRiskFromDrawn?.length ? primaryAssetsAtRiskFromDrawn : [...primaryAssetsAtRiskFromReal, ...primaryAssetsAtRiskFromLive]),
        [primaryAssetsAtRiskFromDrawn, primaryAssetsAtRiskFromReal, primaryAssetsAtRiskFromLive],
    );

    const [dependenciesByFloodArea, assetsByFloodArea] = useMemo(() => {
        let assetsAtRisk = showPrimary ? primaryAssetsAtRisk : [];
        let dependenciesByFloodArea;
        if (showSecondary && !isLoadingDependencies && !isLoadingAssets) {
            const { dependencies: dependenciesAtRisk, dependentAssets: secondaryAssetsAtRisk } = getDependentAssets(primaryAssetsAtRisk);
            assetsAtRisk = [...assetsAtRisk, ...secondaryAssetsAtRisk];
            dependenciesByFloodArea = dependenciesAtRisk;
        } else {
            dependenciesByFloodArea = [];
        }
        return [dependenciesByFloodArea, assetsAtRisk];
    }, [showPrimary, primaryAssetsAtRisk, showSecondary, isLoadingDependencies, getDependentAssets]);

    const assetCriticalities = useMemo(
        () => Array.from(new Set(assetsByFloodArea.map((asset) => asset.dependent.criticalitySum))).sort((a: number, b: number) => a - b),
        [assetsByFloodArea],
    );

    const filterSelectedElements = useCallback(() => {
        dispatch({ type: FILTER_SELECTED_ELEMENTS });
    }, []);

    const [assetsMatchingSelectedTypes, dependenciesMatchingSelectedTypes] = useMemo(() => {
        if (isLoadingDependencies || isLoadingAssets) {
            return [[], []];
        }
        const selectedTypes = Object.keys(selectedAssetTypes).filter((assetType) => selectedAssetTypes[assetType]);
        const assetsMatchingTypes = getAssetsByTypes(selectedTypes);
        const dependenciesToShow = getDependenciesByTypes(selectedTypes);
        return [assetsMatchingTypes, dependenciesToShow];
    }, [isLoadingDependencies, isLoadingAssets, selectedAssetTypes, getAssetsByTypes, getDependenciesByTypes]);

    {
        // Keep assets and dependencies in-state
        const dependencies = useMemo(
            () => Array.from(new Set([...dependenciesMatchingSelectedTypes, ...dependenciesByFloodArea])),
            [dependenciesMatchingSelectedTypes, dependenciesByFloodArea],
        );

        const assets = useMemo(
            () => getUniqueElements([...assetsMatchingSelectedTypes, ...assetsByFloodArea.filter((asset) => asset.dependent.criticalitySum >= minCriticality)]),
            [assetsMatchingSelectedTypes, assetsByFloodArea, minCriticality],
        );

        const missingAssets = useMemo(() => assets.filter((asset: Asset) => !state.assets.includes(asset)), [assets, state.assets]);
        const missingDependencies = useMemo(
            () => dependencies.filter((dependency: Dependency) => !state.dependencies.includes(dependency)),
            [dependencies, state.dependencies],
        );
        const additionalAssets = useMemo(() => state.assets.filter((asset: Asset) => !assets.includes(asset)), [assets, state.assets]);
        const additionalDependencies = useMemo(
            () => state.dependencies.filter((dependency: Dependency) => !dependencies.includes(dependency)),
            [dependencies, state.dependencies],
        );

        const needsDependencyUpdate =
            missingAssets.length > 0 || missingDependencies.length > 0 || additionalAssets.length > 0 || additionalDependencies.length > 0;

        useEffect(() => {
            if (needsDependencyUpdate) {
                // ADD_ASSETS and ADD_DEPENDENCIES don't "add" the items as such, they
                // _replace_ the shown assets and dependencies – so we have to pass the
                // full `assets` and `dependencies` here, not just the missing ones.
                dispatch({ type: ADD_ASSETS, assets: assets });
                dispatch({ type: ADD_DEPENDENCIES, dependencies: dependencies });

                filterSelectedElements();
            }
        }, [assets, dependencies, needsDependencyUpdate, filterSelectedElements]);
    }

    const addElements = useCallback(
        (assets: Asset[], dependencies: Dependency[]) => {
            if (!Array.isArray(assets) || !Array.isArray(dependencies)) {
                return;
            }
            dispatch({ type: ADD_ASSETS, assets });
            dispatch({ type: ADD_DEPENDENCIES, dependencies });
            filterSelectedElements();
        },
        [filterSelectedElements],
    );

    const removeElementsByType = useCallback(
        (typeUri: string) => {
            if (!typeUri) {
                return;
            }
            dispatch({ type: REMOVE_ELEMENTS_BY_TYPE, typeUri });
            filterSelectedElements();
        },
        [filterSelectedElements],
    );

    const reset = useCallback(() => {
        dispatch({ type: RESET });
    }, []);

    const onElementClick = useCallback((multiSelect: boolean, selectedElements: any[]) => {
        if (multiSelect) {
            dispatch({ type: MULTI_SELECT_ELEMENTS, selectedElements });
            return;
        }
        dispatch({ type: SELECT_ELEMENT, selectedElements });
    }, []);

    const onAreaSelect = useCallback((selectedElements: any[]) => {
        if (!Array.isArray(selectedElements)) {
            return;
        }
        dispatch({ type: AREA_SELECTION, selectedElements });
    }, []);

    const updateErrorNotifications = useCallback((msg: string) => {
        dispatch({ type: UPDATE_ERRORS, error: msg });
    }, []);

    const dismissErrorNotification = useCallback((error) => {
        dispatch({ type: DISMISS_ERROR, error });
    }, []);

    const clearSelectedElements = useCallback(() => {
        dispatch({ type: CLEAR_SELECTED });
    }, []);

    const contextValue = useMemo(
        () => ({
            assets,
            assetCriticalities,
            dependencies,
            errors,
            selectedElements,
            maxAssetTotalCxns,
            clickedFloodAreas,
            setClickedFloodAreas,
            assetCriticalityColorScale,
            cxnCriticalityColorScale,
            totalCxnsColorScale,
            addElements,
            clearSelectedElements,
            dismissErrorNotification,
            onAreaSelect,
            onElementClick,
            reset,
            removeElementsByType,
            updateErrorNotifications,
            selectedTimeline,
            closeTimelinePanel,
            onFloodTimelineSelect,
            liveFloodAreas,
        }),
        [
            assets,
            assetCriticalities,
            dependencies,
            errors,
            selectedElements,
            maxAssetTotalCxns,
            clickedFloodAreas,
            setClickedFloodAreas,
            assetCriticalityColorScale,
            cxnCriticalityColorScale,
            totalCxnsColorScale,
            addElements,
            clearSelectedElements,
            dismissErrorNotification,
            onAreaSelect,
            onElementClick,
            reset,
            removeElementsByType,
            updateErrorNotifications,
            selectedTimeline,
            closeTimelinePanel,
            onFloodTimelineSelect,
            liveFloodAreas,
        ],
    );

    return <ElementsContext.Provider value={contextValue}>{children}</ElementsContext.Provider>;
}
