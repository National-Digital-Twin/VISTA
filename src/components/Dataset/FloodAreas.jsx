import React, { useContext, useState } from "react";
import CheckboxTree from "react-checkbox-tree";

import { ElementsContext } from "context";
import { useFloodWatchAreas } from "hooks";

import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "./react-checkbox-tree.css";

const FloodAreas = () => {
  const [expanded, setExpanded] = useState([]);
  const { selectedFloodAreas, onFloodAreaSelect } = useContext(ElementsContext);
  const { isLoading, isError, error, data: floodAreaNodes } = useFloodWatchAreas();

  if (isLoading) return <p>Fetching flood areas</p>;
  if (isError) return <p>{error.message}</p>;

  const onCheck = async (checked) => {
    onFloodAreaSelect(checked);
  };

  return (
    <CheckboxTree
      nodes={floodAreaNodes}
      checked={selectedFloodAreas}
      expanded={expanded}
      onCheck={onCheck}
      onExpand={(expanded) => setExpanded(expanded)}
      checkModel="all"
      showNodeIcon={false}
      noCascade
    />
  );
};

export default FloodAreas;
