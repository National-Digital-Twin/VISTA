import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";

import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

import { useState, startTransition, useCallback } from "react";
import type React from "react";
import classNames from "classnames";
import { Box, TextField } from "@mui/material";
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

  const handleClearSearch = () => {
    onSearch(""); // Clear the search query
  };

  return (
    <Box
      component="form"
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#F0F2F2",
        borderBottom: "2px solid #49454F  ",
        paddingTop: 2,
      }}
    >
      <SearchIcon
        sx={{
          color: "#3670B3",
          marginLeft: 2,
          marginRight: 2,
          paddingBottom: 1,
          fontSize: "40px",
        }}
      />
      <TextField
        type="text"
        fullWidth
        label="Search for layers..."
        value={searchQuery}
        onChange={handleSearchChange}
        className={classNames(styles.searchInput)}
        variant="standard"
        sx={{
          paddingBottom: 2,
          marginRight: 2,
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#3670B3", // Label color when focused
          },
        }}
        InputProps={{
          disableUnderline: true, // Disable the underline
        }}
      />
      {searchQuery && (
        <HighlightOffIcon
          sx={{
            color: "#3670B3",
            paddingLeft: 1,
            paddingRight: 1,
            paddingBottom: 1,
            fontSize: "48px",
          }}
          onClick={handleClearSearch}
        />
      )}
    </Box>
  );
}
