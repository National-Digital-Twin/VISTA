import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import { useMap } from "react-map-gl";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { fitMultiToBounds, fitToBounds } from "components/Map/map-utils";
import { CytoscapeContext, ElementsContext } from "context";
import { getSelectedElements } from "context/elements-reducer";

import { createEdges, createNode, nodeLabels } from "./cytoscapeUtils";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";

import "@fortawesome/fontawesome-pro/css/all.css";

const NetworkGraph = ({ showGrid }) => {
  const { telicentMap: map } = useMap();
  const { cyRef, layout: graphLayout, runLayout, updateLayout } = useContext(CytoscapeContext);
  const { assets, dependencies, selectedElements, clearSelectedElements, onElementClick } = useContext(ElementsContext);

  const nodes = useMemo(() => createNode(assets), [assets]);
  const edges = useMemo(() => createEdges(nodes, dependencies), [nodes, dependencies]);

  cytoscape.use(cola);
  cytoscape.use(dagre);
  cytoscape.use(avsdf);
  if (typeof cytoscape("core", "nodeHtmlLabel") === "undefined") {
    cytoscape.use(nodeHtmlLabel);
  }

  useEffect(() => {
    runLayout();
  }, [nodes, edges, runLayout]);

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.elements().forEach((element) => {
      const selected = selectedElements.some((selectedElement) => {
        const data = element.data("element");
        return selectedElement.uri === data.uri;
      });

      if (selected) element.addClass("highlight-selected");
      else element.removeClass("highlight-selected");
    });
  }, [cyRef, selectedElements]);

  useEffect(() => {
    if (!cyRef.current && map) return;

    const getSelectedCyElements = () => {
      if (!cyRef.current) return;

      const selected = cyRef.current.elements(":selected").map((element) => element.data("element"));
      return selected;
    };

    const selectNode = (event) => {
      const { originalEvent, target } = event;
      const selectedElement = target.data("element");
      const multiSelect = originalEvent.shiftKey;
      const previouslySelected = getSelectedCyElements();
      const selectedElements = getSelectedElements({
        cachedElements: previouslySelected,
        selectedElement,
      });

      if (multiSelect) fitMultiToBounds(map, selectedElements, assets);
      else fitToBounds(map, selectedElement, assets);

      onElementClick(multiSelect, selectedElement);
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
      const selectedElements = getSelectedCyElements();

      fitMultiToBounds(map, selectedElements, assets);
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
  }, [assets, cyRef, map, clearSelectedElements, onElementClick]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
      cyRef.current.nodeHtmlLabel(nodeLabels);
    },
    [cyRef]
  );

  if (showGrid) return null;
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
