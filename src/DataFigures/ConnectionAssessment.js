export default class ConnectionAssessment {
  constructor(item, source, target, criticality) {
    this.category = "connection";
    this.uri = item.connUri;
    this.source = item.asset1Uri;
    this.sourceCriticality = source.criticality;
    this.targetCriticality = target.criticality;
    this.sourceName = source.name;
    this.target = item.asset2Uri;
    this.targetName = target.name;
    this.criticality = criticality;
    this.label = `${source.id}-${target.id}`;

    if (source.hasLatLon()) {
      this.sourceLat = source.getLatitude();
      this.sourceLon = source.getLongitude();
    }

    if (target.hasLatLon()) {
      this.targetLat = target.getLatitude();
      this.targetLon = target.getLongitude();
    }
  }

  getColor = (value) => {
    let hue = ((1 - +value.toFixed(2)) * 120).toString(10);
    console.log(hue);
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
    this.sourceScoreColour = this.getColor(this.sourceCriticality / maxScore);
    this.targetScoreColour = this.getColor(this.targetCriticality / maxScore);
    console.log(" link", this.criticality);
    this.linkScoreColour = this.getColor(this.criticality / maxScore);
  };
}
