
export const createNode = (assets) => {
  return assets.map(asset => asset.toCytoscapeNode())
};

export const createEdges = (connections, colorScale) =>  connections.map((connection) => connection.toCytoscapeEdge(colorScale))
