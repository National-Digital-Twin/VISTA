import DrawnPolygonMenuBody from "./DrawnPolygonMenuBody";
import type { LayerControlProps } from "@/tools/Tool";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function DrawnPolygonLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  const parentCategoryTerms = ["Drawn Polygons", "Polygons"];

  const matchesParentCategory =
    searchQuery &&
    parentCategoryTerms.some(
      (term) =>
        term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(term.toLowerCase()),
    );

  const matchesAnyTerm = !searchQuery || matchesParentCategory;

  if (!matchesAnyTerm) {
    return null;
  }

  return (
    <ComplexLayerControl title="Drawn Polygons" autoShowHide>
      {(updateSelectedCount) => (
        <DrawnPolygonMenuBody
          searchQuery={matchesParentCategory ? "" : searchQuery}
          updateSelectedCount={updateSelectedCount}
        />
      )}
    </ComplexLayerControl>
  );
}
