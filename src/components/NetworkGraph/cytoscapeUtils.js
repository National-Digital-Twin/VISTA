
export const createNode = (assets) => {
  return assets.map(asset => asset.toCytoscapeNode())
};

export const createEdges = (connections, colorScale) =>  connections.map((connection) => connection.toCytoscapeEdge(colorScale))

export const getSelected = (cyRef) => {
  const selected = cyRef.current.elements(":selected");
  const element = selected.map((node) => node.data('element'));
  return element;
}
