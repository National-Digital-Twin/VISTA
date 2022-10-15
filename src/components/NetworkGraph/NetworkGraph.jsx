import avsdf from "cytoscape-avsdf";
import cola from "cytoscape-cola";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";
import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { createEdges, createNode, getSelected } from "./cytoscapeUtils";
import { ElementsContext } from "../../ElementsContext";
import cyStylesheet from "./stylesheet";
import GraphToolbar from "./GraphToolbar";

const NetworkGraph = () => {
  const cyRef = useRef({});
  const { data, graphLayout, onAssetSelect, selectedElements, updateGraphLayout } =
    useContext(ElementsContext);
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
  }, [nodes, edges, graphLayout]);

  useEffect(() => {
    if (!cyRef.current) return;
    assets.forEach((asset) => {
      const cyElement = cyRef.current.getElementById(asset.id);
      const toSelect = selectedElements.some((element) => element.id === asset.id);
      toSelect ? cyElement.select() : cyElement.unselect();
    });
  }, [cyRef, assets, selectedElements]);

  const setCytoscape = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;
      cyRef.current.on("select", "edge", function (event) {
        onAssetSelect(getSelected(cyRef));
      });
      cyRef.current.on("unselect", "edge", function (event) {
        onAssetSelect(getSelected(cyRef));
      });
      cyRef.current.on("select", "node", function (event) {
        onAssetSelect(getSelected(cyRef));
      });
      cyRef.current.on("unselect", "node", function (event) {
        onAssetSelect(getSelected(cyRef));
      });
    },
    [onAssetSelect]
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
