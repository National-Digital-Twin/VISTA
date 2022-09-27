import Fuel from "./assets/gas-station-fill-green.svg";
import Medical from "./assets/medical_services_green_24dp.svg";
import Phone from "./assets/phone-fill-coral.svg";
import Drop from "./assets/drop-fill-blue.svg";
import Battery from "./assets/battery-charge-fill-teal.svg";
import Car from "./assets/car-fill-aqua.svg";

const colors = {
  whiteSmoke: '#F5F5F5',
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
      'text-halign': 'center',
      'text-valign': 'bottom',
      'text-wrap': 'ellipsis',
      'text-max-width': 60,
      'text-margin-y': 4,
    },
  },
  {
    selector: "edge",
    style: {
      curveStyle: "haystack",
      label: "data(label)",
    },
  },
  {
    selector: '.label',
    style: {
      color: colors.whiteSmoke,
      textBackgroundColor: 'rgb(26, 26, 26)',
      textBackgroundPadding: '2px',
      textBackgroundShape: 'round-rectangle',
      fontFamily: 'Urbanist',
      fontWeight: 300,
      fontSize: 6,
      textBackgroundOpacity: 0.7,
      minZoomedFontSize: 10,
    },
  },
  {
    selector: ".F",
    style: {
      backgroundImage: `url(${Fuel})`,
      backgroundColor: "black",
    },
  },
  {
    selector: ".M",
    style: {
      backgroundImage: `url(${Medical})`,
      backgroundColor: "black",
    },
  },
  {
    selector: ".C",
    style: {
      backgroundImage: `url(${Phone})`,
      backgroundColor: "black",
    },
  },
  {
    selector: ".W",
    style: {
      backgroundColor: "black",
      backgroundImage: `url(${Drop})`,
    },
  },
  {
    selector: ".T",
    style: {
      backgroundImage: `url(${Car})`,
      backgroundColor: "black",
    },
  },
  {
    selector: ".E",
    style: {
      backgroundImage: `url(${Battery})`,
      backgroundColor: "black",
    },
  },
  {
    selector: ".1",
    style: {
      "line-color": "Yellow",
    },
  },
  {
    selector: ".2",
    style: {
      "line-color": "Goldenrod",
    },
  },
  {
    selector: ".3",
    style: {
      "line-color": "Red",
    },
  },
  {
    selector: ":selected",
    style: {
      backgroundColor: "white",
      borderWidth: "4px",
      borderColor: "white"
    },
  },
]

export default cyStylesheet;