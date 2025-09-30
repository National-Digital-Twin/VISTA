import DrawnPolygonMenuBody from './DrawnPolygonMenuBody';
import type { LayerControlProps } from '@/tools/Tool';
import ComplexLayerControl from '@/components/ComplexLayerControl';
import useSharedStore from '@/hooks/useSharedStore';

export default function DrawnPolygonLayerControl({ searchQuery }: Readonly<LayerControlProps>) {
    const parentCategoryTerms = ['Drawn Polygons', 'Polygons'];

    const matchesParentCategory =
        searchQuery &&
        parentCategoryTerms.some((term) => term.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery.toLowerCase().includes(term.toLowerCase()));

    const matchesAnyTerm = !searchQuery || matchesParentCategory;

    const features = useSharedStore((state) => state.floodAreaFeatures);

    if (!matchesAnyTerm || !features?.length) {
        return null;
    }

    return (
        <ComplexLayerControl title="Drawn Polygons" autoShowHide>
            {(updateSelectedCount) => <DrawnPolygonMenuBody searchQuery={matchesParentCategory ? '' : searchQuery} updateSelectedCount={updateSelectedCount} />}
        </ComplexLayerControl>
    );
}
