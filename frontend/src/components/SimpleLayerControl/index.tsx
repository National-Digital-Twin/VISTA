import { useMemo } from "react";
import MenuItemRow from "../MenuItemRow";
import useLayer from "@/hooks/useLayer";

export interface SimpleLayerControlProps {
  /** Layer being controlled */
  readonly layerName: string;
  /** Title of the layer */
  readonly title: string;
  /** Current search query */
  readonly searchQuery: string;
  /** Additional terms to match in search, if any */
  readonly terms?: string[];
}

export default function SimpleLayerControl({
  layerName,
  title,
  searchQuery,
  terms,
}: SimpleLayerControlProps) {
  const { enabled, toggle } = useLayer(layerName);

  const fullTerms = useMemo(() => {
    if (terms) {
      return [title, layerName, ...terms];
    } else {
      return [title, layerName];
    }
  }, [title, layerName, terms]);

  return (
    <MenuItemRow
      checked={enabled}
      onChange={toggle}
      primaryText={title}
      terms={fullTerms}
      searchQuery={searchQuery}
    />
  );
}
