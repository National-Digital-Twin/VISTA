import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { useContext, useMemo } from 'react';
import useSharedStore from '@/hooks/useSharedStore';
import { ElementsContext } from '@/context';

function useLiveFloodExtents() {
    const context = useContext(ElementsContext);
    return context?.liveFloodAreas ?? [];
}

function useHistoricFloodExtents() {
    const context = useContext(ElementsContext);
    const floodAreas = useMemo(() => {
        const clickedFloodAreas = context?.clickedFloodAreas ?? {};
        return Object.values(clickedFloodAreas).flat();
    }, [context?.clickedFloodAreas]);
    return floodAreas;
}

function useDrawnFloodExtents() {
    return useSharedStore((store) => store.floodAreaFeatures);
}

function makeFeatureCollection(features: Feature<Polygon>[]): FeatureCollection<Polygon> {
    return {
        type: 'FeatureCollection',
        features: features,
    };
}

export default function useFloodExtents(): FeatureCollection<Polygon> {
    const live = useLiveFloodExtents();
    const historic = useHistoricFloodExtents();
    const drawn = useDrawnFloodExtents();

    const collection = useMemo(() => makeFeatureCollection([...live, ...historic, ...drawn]), [live, historic, drawn]);

    return collection;
}
