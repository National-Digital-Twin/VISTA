import { EnvironmentallySensitiveAreasMenuBody } from './EnvironmentallySensitiveAreasMenuBody';
import { layers } from './environmentally-sensitive-areas-layers';
import type { LayerControlProps } from '@/tools/Tool';

import ComplexLayerControl from '@/components/ComplexLayerControl';

export default function EnvironmentallySensitiveAreasLayerControl({ searchQuery }: Readonly<LayerControlProps>) {
    const parentCategoryTerms = ['Environmentally Sensitive Areas', 'Environmentally', 'Sensitive', 'Areas', 'Environmental'];

    const matchesParentCategory =
        !searchQuery ||
        parentCategoryTerms.some((term) => term.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery.toLowerCase().includes(term.toLowerCase()));

    const layerNames = Object.values(layers).map((layer) => layer.name);
    const allSearchTerms = [...parentCategoryTerms, ...layerNames];

    const matchesAnyTerm =
        !searchQuery ||
        allSearchTerms.some((term) => term.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery.toLowerCase().includes(term.toLowerCase()));

    if (!matchesAnyTerm) {
        return null;
    }

    return (
        <ComplexLayerControl title="Environmentally Sensitive Areas">
            {(updateSelectedCount) => (
                <EnvironmentallySensitiveAreasMenuBody searchQuery={matchesParentCategory ? '' : searchQuery} updateSelectedCount={updateSelectedCount} />
            )}
        </ComplexLayerControl>
    );
}
