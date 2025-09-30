import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { useContext, useMemo } from 'react';
import useSharedStore from '@/hooks/useSharedStore';
import { ElementsContext } from '@/context';

function useLiveFloodExtents() {
    // Live flood extents come from the elements context directly
    const { liveFloodAreas } = useContext(ElementsContext);
    return liveFloodAreas;
}

function useHistoricFloodExtents() {
    // Historic flood extents come from the elements context, though need processing
    const { clickedFloodAreas } = useContext(ElementsContext);
    const floodAreas = useMemo(() => Object.values(clickedFloodAreas).flat(), [clickedFloodAreas]);
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
