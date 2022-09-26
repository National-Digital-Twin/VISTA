import { IsEmpty, colourScale } from "../utils";
import {
  buildLineFeatures,
  buildLineFeature,
  buildCircleFeature,
  buildCircleFeatures,
} from "../components/Map/mapboxFeatures";

const drawAssets = (element) => {
  const lines = [];
  const markers = [];

  if (element.hasSegments()) {
    lines.push(buildLineFeature(element));
  } else {
    markers.push(buildCircleFeature(element));
  }

  const markerAssets = markers.concat(buildCircleFeatures(element.connectsTo));

  return { lineAssets: lines, markerAssets };
};
const sumCriticality = (acc, connection) =>
  (acc += parseInt(connection.criticality));

export default class Asset {
  constructor({ item, idx }) {
    const { name, type, uri, id } = item;
    this.category = "asset";
    this.criticality = 0;
    this.gridIndex = idx + 1;
    this.id = id;
    this.lat = [];
    this.lon = [];
    this.name = name;
    this.type = type;
    this.uri = uri;
    this.connectsTo = [];
    this.connectionList = [];
    this.count = 0;
  }

  /**
   * Process Connections
   * Does the following:
   *  - Set what asset connects to
   *  - Add connections to connectionList
   *  - Sets connection count
   *  - Calculates criticality
   * @param {Array<ConnectionAssessment>} connections
   * @param {Array<Asset>} assets
   */
  processConnections = (connections, assets) => {
    this.setConnections(
      connections.map((connection) =>
        connection.sourceAsset.uri === this.uri
          ? assets[connection.targetAsset.uri]
          : assets[connection.sourceAsset.uri]
      )
    );

    this.connectionList = connections;
    this.count = connections.length;

    this.criticality = connections.reduce(sumCriticality, 0);
  };

  /**
   * Set connections
   * Setter. ConnectsTo
   * @param {Array<ConnectionAssessment>} connections
   */
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

  getCoordinates = () => this.lon.map((lon, index) => [lon, this.lat[index]]);

  getLongitude = () => this.lon;
  setLongitude = (longitude) => {
    if (!longitude) return;
    this.lon.push(parseFloat(longitude));
  };

  calculateScoreColour = (maxScore) => {
    this.maxScore = maxScore;
    this.scoreColour = colourScale
      .getColor(parseInt(99 * this.criticality) / maxScore)
      .toHexString();
  };

  getScoreColour = () => this.scoreColour;

  calculateCountColour = (maxCount) => {
    this.maxCount = maxCount;
    this.countColour = colourScale
      .getColor((99 * this.count) / maxCount)
      .toHexString();
  };

  getSize = () => {
    const maxCircleSize = 10;
    const minCirceSize = 4;
    const radius = this.criticality / this.maxScore;
    const circleSize = Math.ceil(Math.PI * 2 * radius);
    let result;
    if (circleSize > maxCircleSize) {
      result = maxCircleSize;
    } else if (circleSize < minCirceSize) {
      result = minCirceSize;
    } else {
      result = circleSize;
    }
    return result;
  };

  getCountColour = () => this.countColour;

  getCount = () => {
    return this.count;
  };

  hasSegments = () => this.getCoordinates().length > 2;

  getCriticality = () => {
    return this.criticality;
  };

  setCriticality = (criticality) => (this.criticality = criticality);

  hasLatLon = () => {
    return IsEmpty(this.lat) && IsEmpty(this.lon);
  };

  generateMapboxFeatures = () => {
    const { lineAssets, markerAssets } = drawAssets(this);
    const connectionAssets = buildLineFeatures(this.connectionList);

    return { lineAssets: [...lineAssets, ...connectionAssets], markerAssets };
  };
}
