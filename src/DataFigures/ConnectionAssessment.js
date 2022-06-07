const colourMap = {
  1: "green",
  2: "yellow",
  3: "red",
};

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

  getColor = (value) => {
    let hue = ((1 - +value.toFixed(2)) * 120).toString(10);
    return `hsl(${hue},100%, 50%)`;
  };

  setSourceLatitude = (lat) => {
    this.sourceLat = lat;
  };

  setSourceLongitude = (lon) => {
    this.sourceLon = lon;
  };

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

  setTargetLatLon = ({ lat, lon }) => {
    this.setTargetLatitude(lat);
    this.setTargetLongitude(lon);
  };

  calculateScoreColour = (maxScore) => {
    this.sourceScoreColour = this.getColor(
      this.sourceAsset.criticality / maxScore
    );
    this.targetScoreColour = this.getColor(
      this.targetAsset.criticality / maxScore
    );
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

    console.log("eee", this.sourceAsset, this.targetAsset);
    // If road or assets with segments shrink marker size
    const size =
      this.sourceAsset.lat.length > 2 || this.targetAsset.lat.length > 2
        ? 0
        : 7;
    return [
      {
        line: { color: colourMap[this.criticality || 1], text: this.label },
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
