import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { useState, startTransition, useCallback } from "react";
import type React from "react";
import classNames from "classnames";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";
import type { LayerControlProps } from "@/tools/Tool";

export const TOOL_NAME = "Layers control panel";
export const controlPanelTab = {
  title: "Layers",
  icon: faLayerGroup,
};

export function ControlPanelContent() {
  const tools = useTools();

  const [searchQuery, setSearchQuery] = useState("");

  type ToolWithControl = [string, (props: LayerControlProps) => JSX.Element];

  const layerControls = tools("layer-control-order").flatMap((tool) => {
    if (!tool.LayerControl) {
      return [];
    }

    const entry: ToolWithControl = [tool.TOOL_NAME, tool.LayerControl];
    return [entry];
  });

  return (
    <div className={styles.layerPanel}>
      <SearchControl searchQuery={searchQuery} onSearch={setSearchQuery} />
      {layerControls.map(([toolName, Control]) => (
        <Control key={toolName} searchQuery={searchQuery} />
      ))}
    </div>
  );
}

interface SearchControlProps {
  readonly searchQuery: string;
  readonly onSearch: (query: string) => void;
}

function SearchControl({ searchQuery, onSearch }: SearchControlProps) {
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      startTransition(() => {
        onSearch(event.target.value);
      });
    },
    [onSearch],
  );

  return (
    <form className={styles.searchForm}>
      <input
        type="search"
        className={classNames("form-control", styles.searchInput)}
        placeholder="Search for layers..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
    </form>
  );
}
