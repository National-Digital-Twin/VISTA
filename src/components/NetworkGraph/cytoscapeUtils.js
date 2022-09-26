class Node {
  constructor(id, scoreColor, uri) {
    this.data = {
      id: uri,
      label: id,
      style: {
        borderColor: scoreColor,
        height: 40,
        width: 40,
      },
    };
    this.classes = ["label", id.charAt(0)];
  }
}
export const createNode = (assets) =>
  assets.map(({ id, scoreColor, uri }) => ({ ...new Node(id, scoreColor, uri) }));

class Edge {
  constructor(criticality, label, source, target, uri) {
    this.data = {
      id: uri,
      label,
      source,
      target,
    };
    this.classes = ["label", criticality.toString()];
  }
}
export const createEdges = (connections) =>
  connections.map(({ criticality, label, source, target, uri }) => ({
    ...new Edge(criticality, label, source, target, uri),
  }));
