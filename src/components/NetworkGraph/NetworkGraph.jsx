import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { createEdges, createNode } from "./cytoscapeUtils";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";
import { CytoscapeContext, ElementsContext } from "../../context";

const NetworkGraph = () => {
  const {
    cyRef,
    layout: graphLayout,
    getSelectedElements,
    updateLayout,
  } = useContext(CytoscapeContext);
  const { data, onAssetSelect } = useContext(ElementsContext);
  const { assets, connections, cxnCriticalityColorScale } = data;

  const nodes = useMemo(() => createNode(assets), [assets]);
  const edges = useMemo(
    () => createEdges(connections, cxnCriticalityColorScale),
    [connections, cxnCriticalityColorScale]
  );

  cytoscape.use(cola);
  cytoscape.use(dagre);
  cytoscape.use(avsdf);

  useEffect(() => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout({ name: graphLayout });
    layout.run();
  }, [cyRef, nodes, edges, graphLayout]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
      cyRef.current.on("select", "edge", function (event) {
        onAssetSelect(getSelectedElements());
      });
      cyRef.current.on("unselect", "edge", function (event) {
        onAssetSelect(getSelectedElements());
      });
      cyRef.current.on("select", "node", function (event) {
        onAssetSelect(getSelectedElements());
      });
      cyRef.current.on("unselect", "node", function (event) {
        onAssetSelect(getSelectedElements());
      });
    },
    [cyRef, getSelectedElements, onAssetSelect]
  );

  return (
    <>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements({ nodes, edges })}
        stylesheet={cyStylesheet}
        cy={setCytoscape}
        className="w-full h-full"
      />
      <GraphToolbar cyRef={cyRef} graphLayout={graphLayout} setGraphLayout={updateLayout} />
    </>
  );
};

export default NetworkGraph;
