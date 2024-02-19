const colors = {
  whiteSmoke: "#F5F5F5",
};

const cyStylesheet = [
  {
    selector: "node",
    style: {
      width: "60px",
      height: "60px",
      borderWidth: "4px",
      borderColor: "data(color)",
      backgroundColor: "data(backgroundColor)",
      label: "data(label)",
      "text-halign": "center",
      "text-valign": "bottom",
      "text-wrap": "ellipsis",
      "text-max-width": 60,
      "text-margin-y": 4,
    },
  },
  {
    selector: "edge",
    style: {
      curveStyle: "bezier",
      label: "data(label)",
      lineColor: "data(color)",
      width: 2,
      arrowScale: 1.5,
      lineOpacity: 0.8,
      sourceArrowShape: "vee",
      sourceArrowColor: "data(color)",
    },
  },
  {
    selector: ".label",
    style: {
      color: colors.whiteSmoke,
      textBackgroundColor: "rgb(26, 26, 26)",
      textBackgroundPadding: "2px",
      textBackgroundShape: "round-rectangle",
      fontFamily: "Figtree",
      fontWeight: 300,
      fontSize: 14,
      textBackgroundOpacity: 0.7,
    },
  },
  {
    selector: "node.highlight-selected",
    style: {
      borderWidth: "4px",
      borderColor: colors.whiteSmoke,
    },
  },
  {
    selector: "edge.highlight-selected",
    style: {
      width: 3,
      lineOpacity: 1,
    },
  },
];

export default cyStylesheet;
