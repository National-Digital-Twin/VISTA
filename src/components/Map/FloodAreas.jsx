import React, { useContext, useState } from "react";
import CheckboxTree from "react-checkbox-tree";
import { useQueries, useQuery } from "react-query";

import { ElementsContext } from "context";
import { fetchAllFloodAreas, fetchFloodAreaPolygon } from "endpoints";
import { generateFloodAreaNodes } from "./map-utils";

import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "./react-checkbox-tree.css";

const FloodAreas = () => {
  const {
    isLoading,
    isError,
    error,
    data: floodWatchAreas,
  } = useQuery("flood-areas", () => fetchAllFloodAreas());
  const floodAreaNodes = generateFloodAreaNodes(floodWatchAreas);

  return (
    <>
      <h2 className="font-medium text-lg">Flood areas</h2>
      <FloodWatchAreas
        isLoading={isLoading}
        isError={isError}
        error={error}
        floodAreaNodes={floodAreaNodes}
      />
    </>
  );
};

export default FloodAreas;

const FloodWatchAreas = ({ isLoading, isError, error, floodAreaNodes }) => {
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const { addFloodAreas, removeFloodAreas } = useContext(ElementsContext);

  useQueries(
    checked.map((polygonUri) => {
      return {
        queryKey: ["flood-area-polygon", polygonUri],
        queryFn: () => fetchFloodAreaPolygon(polygonUri),
        onSuccess: (data) => {
          const features = data?.features;
          if (features) addFloodAreas(features);
        },
      };
    })
  );

  if (isLoading) return <p>Fetching flood information</p>;
  if (isError) return <p>{error.message}</p>;

  const onCheck = async (checked, { value: polygonUri, checked: isChecked }) => {
    setChecked(checked);

    if (!isChecked) {
      removeFloodAreas(polygonUri);
    }
  };

  return (
    <CheckboxTree
      nodes={floodAreaNodes}
      checked={checked}
      expanded={expanded}
      onCheck={onCheck}
      onExpand={(expanded) => setExpanded(expanded)}
      checkModel="all"
      noCascade
      showNodeIcon={false}
    />
  );
};
