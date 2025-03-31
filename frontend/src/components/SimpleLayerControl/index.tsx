import { useEffect, useMemo, useRef } from "react";
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
  /** Optional function to update the selected count */
  readonly updateSelectedCount?: (isSelected: boolean) => void;
}

export default function SimpleLayerControl({
  layerName,
  title,
  searchQuery,
  terms,
  updateSelectedCount,
}: SimpleLayerControlProps) {
  const { enabled, toggle } = useLayer(layerName);

  const fullTerms = useMemo(() => {
    if (terms) {
      return [title, layerName, ...terms];
    } else {
      return [title, layerName];
    }
  }, [title, layerName, terms]);

  // Track whether the component has mounted to prevent double increment
  const hasMounted = useRef(false);

  // Notify parent about the initial state when the component mounts
  useEffect(() => {
    if (updateSelectedCount && !hasMounted.current) {
      updateSelectedCount(enabled); // Notify parent about the initial state
      hasMounted.current = true; // Mark as mounted
    }
  }, [enabled, updateSelectedCount]);

  const handleToggle = () => {
    toggle(); // Toggle the layer state
    if (updateSelectedCount) {
      updateSelectedCount(!enabled); // Notify parent about the new state
    }
  };

  return (
    <MenuItemRow
      checked={enabled}
      onChange={handleToggle}
      primaryText={title}
      terms={fullTerms}
      searchQuery={searchQuery}
    />
  );
}
