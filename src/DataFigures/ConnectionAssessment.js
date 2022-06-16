import ColorScale from "color-scales";
const colourMap = {
  1: "green",
  2: "yellow",
  3: "red",
};

const colourScale = new ColorScale(0, 100, ["#198c00", "#ff0100"], 1);

export default class ConnectionAssessment {
  /*
    source and target uri's are duplicated in both (sourceAsset and targetAsset)
    due to a cytoscape requirement.

    The reason for including the whole asset was to update the criticality colours on the asset object itself,
    rather than a primitive instance of the colour which caused the same asset to show as different colours on different connections.
  */
  constructor(item, source, target, criticality) {
    this.category = "connection";
    this.criticality = parseInt(criticality);
    this.label = `${source.id}-${target.id}`;
    this.source = item.asset1Uri;
    this.sourceAsset = source;
    this.sourceName = source.name;
    this.target = item.asset2Uri;
    this.targetAsset = target;
    this.targetName = target.name;
    this.uri = item.connUri;
  }

  getColour = () => this.scoreColour;
  setColour = (maxScore) => {
    this.scoreColour = colourScale
      .getColor((99 * this.criticality) / maxScore)
      .toHexString();
  };

  setSourceLatitude = (lat) => {
    this.sourceLat = lat;
  };

  setSourceLongitude = (lon) => {
    this.sourceLon = lon;
  };

  getSourceLatLon = () => this.sourceAsset.getLonLat();
  setSourceLatLon = ({ lat, lon }) => {
    this.setSourceLatitude(lat);
    this.setSourceLongitude(lon);
  };

  setTargetLatitude = (lat) => {
    this.targetLat = lat;
  };

  setTargetLongitude = (lon) => {
    this.targetLon = lon;
  };

  getTargetLatLon = () => this.targetAsset.getLonLat();

  setTargetLatLon = ({ lat, lon }) => {
    this.setTargetLatitude(lat);
    this.setTargetLongitude(lon);
  };

  getCoordinates = () => {
    console.log(this.sourceAsset);
    const sourceCoords = this.sourceAsset.lon.map((lon, index) => {
      return [lon, this.sourceAsset.lat[index]];
    });

    const targetCoords = this.targetAsset.lon.map((lon, index) => {
      return [lon, this.targetAsset.lat[index]];
    });

    return sourceCoords.concat(targetCoords);
  };

  getMapboxMarkup = () => {
    const lon = this.sourceAsset
      .getLongitude()
      .concat(this.targetAsset.getLongitude());
    const lat = this.sourceAsset
      .getLatitude()
      .concat(this.targetAsset.getLatitude());
    const sparseArray = new Array(lon.length);

    const color = sparseArray
      .fill()
      .map(() => [this.sourceAsset.scoreColour, this.targetAsset.scoreColour])
      .flat();

    // console.log("eee", this.sourceAsset, this.targetAsset);
    console.log(this.criticality);
    // If road or assets with segments shrink marker size
    const size =
      this.sourceAsset.lat.length > 2 || this.targetAsset.lat.length > 2
        ? 0
        : 7;
    return [
      {
        line: { color: colourMap[this.criticality] },
        lat,
        lon,
        marker: {
          size,
          cmin: 1,
          cmax: 5,
          color,
        },
        mode: "markers+text+lines",
        name: this.label,
        text: this.label,
        type: "scattermapbox",
      },
    ];
  };
}
