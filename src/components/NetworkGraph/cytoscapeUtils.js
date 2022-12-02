
export const createNode = (assets) => {
  return assets.map(asset => asset.toCytoscapeNode())
};

export const createEdges = (dependencies, colorScale) =>  dependencies.map((dependency) => dependency.toCytoscapeEdge(colorScale))
