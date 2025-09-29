import { RoadRouteMenuBody } from './RoadRouteMenuBody';
import type { LayerControlProps } from '@/tools/Tool';

import ComplexLayerControl from '@/components/ComplexLayerControl';
import featureFlags from '@/config/feature-flags';

export default function RoadRouteLayerControl({ searchQuery }: Readonly<LayerControlProps>) {
    if (!featureFlags.routing) {
        return null;
    }

    if (
        searchQuery &&
        !(
            'Road Route'.toLowerCase().includes(searchQuery.toLowerCase()) ||
            'road'.toLowerCase().includes(searchQuery.toLowerCase()) ||
            'route'.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) {
        return null;
    }

    return (
        <ComplexLayerControl title="Road Route">
            {(updateSelectedCount) => <RoadRouteMenuBody searchQuery={searchQuery} updateSelectedCount={updateSelectedCount} />}
        </ComplexLayerControl>
    );
}
