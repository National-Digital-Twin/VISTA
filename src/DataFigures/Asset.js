import { IsEmpty } from "../utils";

const colourMap = {
  1: "green",
  2: "yellow",
  3: "red",
};

export default class Asset {
  constructor(item, idx) {
    this.category = "asset";
    this.count = 0;
    this.criticality = 0;
    this.gridIndex = idx + 1;
    this.id = item.id;
    this.lat = [];
    this.lon = [];
    this.name = item.name;
    this.type = item.type;
    this.uri = item.uri;
  }

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

  appendLatitude = (latitudes) => {
    if (IsEmpty(latitudes)) return;
    this.lat = this.lat.concat(latitudes);
  };

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
    this.scoreColour = this.getColor(this.criticality / maxScore);
  };

  calculateCountColour = (maxCount) => {
    this.countColour = this.getColor(this.count / maxCount);
  };

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

  hasLatLon = () => {
    return IsEmpty(this.lat) && IsEmpty(this.lon);
  };

  getMapboxMarkup = () => {
    const sparseArray = new Array(this.lon.length);
    const lineColour = colourMap[this.criticality || 1];

    const color = sparseArray.fill().map(() => this.scoreColour);

    // If road or assets with segments shrink marker size
    const size = this.lat.length > 2 || this.lon > 2 ? 1 : 7;
    return {
      type: "scattermapbox",
      marker: {
        size,
        cmin: 1,
        cmax: 5,
        color,
      },
      line: { color: lineColour, text: this.label },
      text: this.label,
      name: this.label,
      lon: this.lon,
      lat: this.lat,
    };
  };
}
