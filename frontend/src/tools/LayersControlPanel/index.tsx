import { faLayerGroup, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState, startTransition, useCallback } from "react";
import type React from "react";
import classNames from "classnames";
import { Box, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";
import type { LayerControlProps } from "@/tools/Tool";

export const TOOL_NAME = "Layers control panel";
export const controlPanelTab = {
  title: "Layers",
  icon: faLayerGroup,
};

export function LayersControlPanel() {
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
    <div>
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
    <Box
      component="form"
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#e0e0e0",
      }}
    >
      <FontAwesomeIcon
        icon={faSearch}
        size="2x"
        style={{ color: "#1976d2", padding: 20 }}
      />
      <TextField
        type="search"
        fullWidth
        label="Search for layers..."
        value={searchQuery}
        onChange={handleSearchChange}
        className={classNames(styles.searchInput)}
        variant="standard"
        sx={{
          paddingBottom: 2,
        }}
      />
    </Box>
  );
}
