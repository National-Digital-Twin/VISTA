import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import { useMap } from "react-map-gl";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { fitMultiToBounds } from "components/Map/map-utils";
import { CytoscapeContext, ElementsContext } from "context";
import { getUniqueElements } from "utils";

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

    const selectNode = (elements, isMultiSelect) => {
      const previouslySelected = getSelectedCyElements();
      const selectedElements = getUniqueElements([...previouslySelected, ...elements]);

      fitMultiToBounds(map, selectedElements, assets);
      onElementClick(isMultiSelect, elements);
    };

    const onNodeTap = (event) => {
      const { originalEvent, target } = event;
      const isMultiSelect = originalEvent.shiftKey;
      const connectedEdges = target.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      const elements = [...connectedNodes.jsons(), ...connectedEdges.jsons()].map(
        (element) => element.data.element
      );

      selectNode(elements, isMultiSelect);
    };
    const onEdgeTap = (event) => {
      const { originalEvent, target } = event;
      const isMultiSelect = originalEvent.shiftKey;
      const connectedNodes = target.connectedNodes();
      const elements = connectedNodes.jsons().map((element) => element.data.element);

      selectNode([target.data("element"), ...elements], isMultiSelect);
    };
    const onTap = (event) => {
      if (event.target === cyRef.current) {
        clearSelectedElements();
      }
    };
    const onBoxSelect = (event) => {
      const { target } = event;
      const connectedEdges = target.isEdge() ? target.connectedNodes() : target.connectedEdges();
      const connectedNodes = target.isNode() ? connectedEdges.connectedNodes() : target;
      const elements = [...connectedEdges.jsons(), ...connectedNodes.jsons()].map(
        (element) => element.data.element
      );
      const previouslySelected = getSelectedCyElements();
      const selectedElements = getUniqueElements([...previouslySelected, ...elements]);

      fitMultiToBounds(map, selectedElements, assets);
      onElementClick(true, elements);
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
