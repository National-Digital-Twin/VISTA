import FloodAreasMenuBody from "./FloodAreas/FloodAreasMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function FloodAreaLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  const parentCategoryTerms = [
    "Flood Polygons",
    "Flood",
    "Floods",
    "Flooding",
    "Polygons",
  ];

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
    <ComplexLayerControl title="Flood Polygons" autoShowHide>
      {(updateSelectedCount) => (
        <FloodAreasMenuBody
          searchQuery={matchesParentCategory ? "" : searchQuery}
          updateSelectedCount={updateSelectedCount}
        />
      )}
    </ComplexLayerControl>
  );
}
