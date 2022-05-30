export default class Asset {
  constructor(item, idx) {
    this.category = "asset";
    this.gridIndex = idx + 1;
    this.id = item.id;
    this.name = item.name;
    this.uri = item.uri;
    this.count = 0;
    this.criticality = 0;
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
    this.lat = parseFloat(latitude);
  };

  getLongitude = () => this.lon;
  setLongitude = (longitude) => {
    if (!longitude) return;
    this.lon = parseFloat(longitude);
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
    return this.hasOwnProperty("lat") && this.hasOwnProperty("lon");
  };
}
