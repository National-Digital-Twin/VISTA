import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import { useMap } from "react-map-gl";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { center as turfCenter, points } from "@turf/turf";

import { CytoscapeContext, ElementsContext } from "context";
import { getSelected } from "context/elements-reducer";

import { createEdges, createNode } from "./cytoscapeUtils";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";

const NetworkGraph = () => {
  const { telicentMap: map } = useMap();
  const { cyRef, layout: graphLayout, runLayout, updateLayout } = useContext(CytoscapeContext);
  const { assets, dependencies, selectedElements, clearSelectedElements, onElementClick } =
    useContext(ElementsContext);

  const nodes = useMemo(() => createNode(assets), [assets]);
  const edges = useMemo(() => createEdges(dependencies), [dependencies]);

  cytoscape.use(cola);
  cytoscape.use(dagre);
  cytoscape.use(avsdf);

  useEffect(() => {
    runLayout();
  }, [nodes, edges, runLayout]);

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().forEach((element) => {
      const selected = selectedElements.some((selectedElement) => {
        const data = element.data("element")
        return selectedElement.id === data.id;
      });
      if (selected) {
        element.addClass("highlight-selected");
        return;
      }
      element.removeClass("highlight-selected");
    });
  }, [cyRef, selectedElements]);

  useEffect(() => {
    if (!cyRef.current && map) return;

    const selectNode = (event) => {
      const data = event.target.data("element");
      const multiSelect = event.originalEvent.shiftKey;

      if (multiSelect) {
        const previouslySelected = cyRef.current
          .elements(":selected")
          .map((element) => element.data("element"));
        const lngLats = getSelected({ cachedElements: previouslySelected, selectedElement: data })
          .filter((element) => element.lng && element.lat)
          .map((element) => [element.lng, element.lat]);
        const features = points(lngLats);
        const center = turfCenter(features).geometry.coordinates;

        map.jumpTo({ center, zoom: 10 });
      } else map.jumpTo({ center: [data.lng, data.lat], zoom: 12 });

      onElementClick(multiSelect, data);
    };

    const onNodeTap = (event) => {
      selectNode(event);
    };
    const onEdgeTap = (event) => {
      selectNode(event);
    };
    const onTap = (event) => {
      if (event.target === cyRef.current) {
        clearSelectedElements();
      }
    };
    const onBoxSelect = (event) => {
      const { target } = event;
      onElementClick(true, target.data("element"));
    };

    cyRef.current.on("boxselect", onBoxSelect);
    cyRef.current.on("tap", "edge", onEdgeTap);
    cyRef.current.on("tap", "node", onNodeTap);
    cyRef.current.on("tap", onTap);

    return () => {
      cyRef.current.off("boxselect", onBoxSelect);
      cyRef.current.off("tap", "edge", onEdgeTap);
      cyRef.current.off("tap", "node", onNodeTap);
      cyRef.current.off("tap", onTap);
    };
  }, [cyRef, map, clearSelectedElements, onElementClick]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
    },
    [cyRef]
  );

  return (
    <>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements({ nodes, edges })}
        stylesheet={cyStylesheet}
        cy={setCytoscape}
        className="w-full h-full"
        minZoom={0.1}
      />
      <GraphToolbar cyRef={cyRef} graphLayout={graphLayout} setGraphLayout={updateLayout} />
    </>
  );
};

export default NetworkGraph;
