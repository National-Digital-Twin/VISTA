import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { CytoscapeContext, ElementsContext } from "context";

import { createEdges, createNode } from "./cytoscapeUtils";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";

const NetworkGraph = () => {
  const { cyRef, layout: graphLayout, runLayout, updateLayout } = useContext(CytoscapeContext);
  const { assets, dependencies, clearSelectedElements, onElementClick } =
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

    const onNodeTap = (event) => {
      const { originalEvent, target } = event;
      onElementClick(originalEvent.shiftKey, target.data('element'));
    };
    const onEdgeTap = (event) => {
      const { originalEvent, target } = event;
      onElementClick(originalEvent.shiftKey, target.data('element'));
    };
    const onTap = (event) => {
      if (event.target === cyRef.current) {
        clearSelectedElements();
      }
    };
    const onBoxSelect = (event) => {
      const { target } = event;
      onElementClick(true, target.data('element'));
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
  }, [cyRef, clearSelectedElements, onElementClick]);

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
