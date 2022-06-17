import { IsEmpty } from "../utils";
import ColorScale from "color-scales";

const colourMap = {
  1: "green",
  2: "yellow",
  3: "red",
};

const colourScale = new ColorScale(0, 100, ["#198c00", "#ff0100"], 1);

const sumCriticality = (acc, connection) =>
  (acc += parseInt(connection.criticality));

export default class Asset {
  constructor(item, idx) {
    this.category = "asset";
    this.criticality = 0;
    this.gridIndex = idx + 1;
    this.id = item.id;
    this.lat = [];
    this.lon = [];
    this.name = item.name;
    this.type = item.type;
    this.uri = item.uri;
    this.connectsTo = [];
    this.count = 0;
  }

  processConnections = (connections, assets) => {
    this.setConnections(
      connections.map((connection) =>
        connection.asset1Uri === this.uri
          ? assets[connection.asset2Uri]
          : assets[connection.asset1Uri]
      )
    );

    this.count = connections.length;

    this.criticality = connections.reduce(sumCriticality, 0);
  };

  setConnections = (connections) => {
    this.connectsTo = connections;
  };
  getColor = (value) => {
    let hue = ((1 - value) * 120).toString(10);
    return `hsl(${hue},100%, 50%)`;
  };

  setDescription = (description) => {
    if (!description) return;
    this.desc = description;
  };

  getLatitude = () => this.lat;
  setLatitude = (latitude) => {
    if (!latitude) return;
    this.lat.push(parseFloat(latitude));
  };

  setPath = (latitudes, longitudes) => {
    if (IsEmpty(latitudes) || IsEmpty(longitudes)) return;
    this.lat = latitudes;
    this.lon = longitudes;
  };

  getLonLat = () => [this.lon, this.lat];
  getLongitude = () => this.lon;
  setLongitude = (longitude) => {
    if (!longitude) return;
    this.lon.push(parseFloat(longitude));
  };

  appendLongitude = (longitudes) => {
    if (IsEmpty(longitudes)) return;
    this.lon = this.lon.concat(longitudes);
  };

  calculateScoreColour = (maxScore) => {
    this.scoreColour = colourScale
      .getColor((99 * this.criticality) / maxScore)
      .toHexString();
  };

  getScoreColour = () => this.scoreColour;

  calculateCountColour = (maxCount) => {
    this.countColour = colourScale
      .getColor((99 * this.count) / maxCount)
      .toHexString();
  };

  getCountColour = () => this.countColour;

  incrementCount = () => {
    this.count = this.count + 1;
  };

  getCount = () => {
    return this.count;
  };

  isCountGreaterThan = (max) => this.count > max;

  getCriticality = () => {
    return this.criticality;
  };

  isCriticalityGreaterThan = (max) => this.criticality > max;

  incrementCriticalityBy = (criticality) => {
    this.criticality = this.criticality + criticality;
  };
  setCriticality = (criticality) => (this.criticality = criticality);

  hasLatLon = () => {
    return IsEmpty(this.lat) && IsEmpty(this.lon);
  };

  getMapboxMarkup = () => {
    const sparseArray = new Array(this.lon.length);
    const lineColour = colourMap[this.criticality || 1];

    const color = sparseArray.fill().map(() => this.scoreColour);

    // If road or assets with segments shrink marker size
    const size = this.lat.length > 2 || this.lon > 2 ? 0 : 7;
    return {
      type: "scattermapbox",
      marker: {
        size,
        cmin: 1,
        cmax: 5,
        color,
      },
      line: { color: lineColour },
      text: this.label,
      name: this.label,
      lon: this.lon,
      lat: this.lat,
    };
  };
}
