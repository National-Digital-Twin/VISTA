import React, { useContext, useState } from "react";
import CheckboxTree from "react-checkbox-tree";
import { useQueries, useQuery } from "react-query";
import PropTypes from "prop-types";

import { ElementsContext } from "context";
import { fetchAllFloodAreas, fetchFloodAreaPolygon } from "endpoints";
import { generateFloodAreaNodes } from "../Map/map-utils";

import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "./react-checkbox-tree.css";

const FloodAreas = ({ selectedFloodAreas, setSelectedFloodAreas }) => {
  const [expanded, setExpanded] = useState([]);
  const { addFloodAreas, removeFloodAreas } = useContext(ElementsContext);

  const {
    isLoading,
    isError,
    error,
    data: floodWatchAreas,
  } = useQuery("flood-areas", () => fetchAllFloodAreas());
  const floodAreaNodes = generateFloodAreaNodes(floodWatchAreas);

  useQueries(
    selectedFloodAreas.map((polygonUri) => {
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
    setSelectedFloodAreas(checked);

    if (!isChecked) {
      removeFloodAreas(polygonUri);
    }
  };

  return (
    <CheckboxTree
      nodes={floodAreaNodes}
      checked={selectedFloodAreas}
      expanded={expanded}
      onCheck={onCheck}
      onExpand={(expanded) => setExpanded(expanded)}
      checkModel="all"
      noCascade
      showNodeIcon={false}
    />
  );
};

export default FloodAreas;
FloodAreas.defaultProps = {
  selectedFloodAreas: [],
};
FloodAreas.propTypes = {
  selectedFloodAreas: PropTypes.arrayOf(PropTypes.string),
  setSelectedFloodAreas: PropTypes.func.isRequired,
};
