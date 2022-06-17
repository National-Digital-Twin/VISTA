import { buildCircleFeature, buildLineFeature } from "../Map/mapboxFeatures";
import { colourScale } from "../utils";

const colourMap = {
  1: "yellow",
  2: "orange",
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

  getColour = () => this.scoreColour;
  setColour = (maxScore) => {
    this.scoreColour = colourScale
      .getColor((99 * this.criticality) / maxScore)
      .toHexString();
  };

  getScoreColour = () => colourMap[this.criticality];

  getCoordinates = () => {
    const sourceCoords = this.sourceAsset.lon.map((lon, index) => {
      return [lon, this.sourceAsset.lat[index]];
    });

    const targetCoords = this.targetAsset.lon.map((lon, index) => {
      return [lon, this.targetAsset.lat[index]];
    });

    return sourceCoords.concat(targetCoords);
  };

  generateMapboxFeatures = () => {
    const markerAssets = [
      buildCircleFeature(this.sourceAsset),
      buildCircleFeature(this.targetAsset),
    ];
    const lineAssets = [buildLineFeature(this)];
    return { markerAssets, lineAssets };
  };
}
