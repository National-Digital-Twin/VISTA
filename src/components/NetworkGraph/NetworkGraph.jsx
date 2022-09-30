import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { createEdges, createNode } from "./cytoscapeUtils";
import { ElementsContext } from "../../ElementsContext";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";
import useSelectNode from "../../hooks/useSelectNode";

const NetworkGraph = ({ assets, connections }) => {
  const cyRef = useRef({});
  const nodes = useMemo(() => createNode(assets), [assets]);
  const edges = useMemo(() => createEdges(connections), [connections]);
  const [setSelectedNode] = useSelectNode(assets, connections);
  const { graphLayout, updateGraphLayout } = useContext(ElementsContext);

  cytoscape.use(cola);
  cytoscape.use(dagre);
  cytoscape.use(avsdf);

  useEffect(() => {
    const layout = cyRef.current.layout({ name: graphLayout });
    layout.run();
  }, [nodes, edges, graphLayout]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
      cyRef.current.on("tap", "node", function (event) {
        const { target } = event;
        setSelectedNode(target.id(), "asset");
      });
      cyRef.current.on("tap", "edge", function (event) {
        const { target } = event;
        setSelectedNode(target.id(), "connection");
      });
    },
    [setSelectedNode]
  );

  return (
    <>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements({ nodes, edges })}
        stylesheet={cyStylesheet}
        cy={setCytoscape}
        className="w-full h-full"
      />
      <GraphToolbar cyRef={cyRef} graphLayout={graphLayout} setGraphLayout={updateGraphLayout} />
    </>
  );
};

export default NetworkGraph;
