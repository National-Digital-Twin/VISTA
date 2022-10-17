import Fuel from "./assets/gas-station-fill-green.svg";
import Medical from "./assets/medical_services_green_24dp.svg";
import Phone from "./assets/phone-fill-coral.svg";
import Drop from "./assets/drop-fill-blue.svg";
import Battery from "./assets/battery-charge-fill-teal.svg";
import Car from "./assets/car-fill-aqua.svg";
import User3 from "./assets/user-3.svg";

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
      borderColor: "gray",
      backgroundColor: "black",
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
      curveStyle: "haystack",
      label: "data(label)",
      "line-color": "data(color)"
    },
  },
  {
    selector: ".label",
    style: {
      color: colors.whiteSmoke,
      textBackgroundColor: "rgb(26, 26, 26)",
      textBackgroundPadding: "2px",
      textBackgroundShape: "round-rectangle",
      fontFamily: "Urbanist",
      fontWeight: 300,
      fontSize: 12,
      textBackgroundOpacity: 0.7,
      minZoomedFontSize: 8,
    },
  },
  {
    selector: ".F",
    style: {
      backgroundImage: `url(${Fuel})`,
    },
  },
  {
    selector: ".M",
    style: {
      backgroundImage: `url(${Medical})`,
    },
  },
  {
    selector: ".C",
    style: {
      backgroundImage: `url(${Phone})`,
    },
  },
  {
    selector: ".W",
    style: {
      backgroundImage: `url(${Drop})`,
    },
  },
  {
    selector: ".T",
    style: {
      backgroundImage: `url(${Car})`,
    },
  },
  {
    selector: ".E",
    style: {
      backgroundImage: `url(${Battery})`,
    },
  },
  {
    selector: ".V",
    style: {
      backgroundImage: `url(${User3})`,
    },
  },
  {
    selector: ":selected",
    style: {
      borderWidth: "4px",
      borderColor: colors.whiteSmoke,
    },
  },
];

export default cyStylesheet;
