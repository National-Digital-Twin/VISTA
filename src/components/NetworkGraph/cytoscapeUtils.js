import { isEmpty } from "lodash";

export const createNode = (assets) => {
  return assets.map((asset) => asset.toCytoscapeNode());
};

export const createEdges = (nodes, dependencies) => {
  if (isEmpty(nodes)) return [];
  return dependencies.map((dependency) => dependency.toCytoscapeEdge());
};

export const nodeLabels = [
  {
    query: ".nodeElem",
    valign: "center",
    halign: "center",
    valignBox: "center",
    halignBox: "center",
    tpl: (data) => {
    let label = "<i class='" + data.icon + "'></i>";
      if (!data.icon) {
        label = data.iconLabel;
      }

      return (
        "<div class='flex items-center justify-center' style='color:" +
        data.color +
        ";'>" +
        label +
        "</div>"
      );
    },
  },
];
