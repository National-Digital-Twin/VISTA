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
import { isEmpty } from "lodash";

const NetworkGraph = () => {
  const { cyRef, layout: graphLayout, runLayout, updateLayout } = useContext(CytoscapeContext);
  const { assets, connections, cxnCriticalityColorScale, clearSelectedElements, onElementClick } =
    useContext(ElementsContext);

  const nodes = useMemo(() => createNode(assets), [assets]);
  const edges = useMemo(() => {
    if (isEmpty(nodes)) return [];
    return createEdges(connections, cxnCriticalityColorScale);
  }, [connections, nodes, cxnCriticalityColorScale]);

  cytoscape.use(cola);
  cytoscape.use(dagre);
  cytoscape.use(avsdf);

  useEffect(() => {
    runLayout();
  }, [nodes, edges, runLayout]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
      cyRef.current.on("tap", "edge", function (event) {
        onElementClick(event.originalEvent.shiftKey, event.target.data());
      });
      cyRef.current.on("tap", "node", function (event) {
        onElementClick(event.originalEvent.shiftKey, event.target.data());
      });
      cyRef.current.on("boxselect", function (event) {
        onElementClick(true, event.target.data());
      });
      cyRef.current.on("tap", function (event) {
        if (event.target === cy) {
          clearSelectedElements();
          return;
        }
      });
    },
    [cyRef, clearSelectedElements, onElementClick]
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
