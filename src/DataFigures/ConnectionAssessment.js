export default class ConnectionAssessment {
  constructor(item, source, target, criticality) {
    this.category = "connection";
    this.uri = item.connUri;
    this.source = item.asset1Uri;
    this.sourceName = source.name;
    this.sourceScoreColour = source.scoreColour;
    this.target = item.asset2Uri;
    this.targetName = target.name;
    this.targetScoreColour = target.scoreColour;
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
}
