import { findAsset, getHexColor } from "../utils";

export default class Connection {
  constructor({ uri, criticality, source, target }) {
    this.id = uri;
    this.criticality = parseFloat(criticality);
    this.source = source;
    this.target = target;
    this.label = `${source.split("#")[1]} - ${target.split("#")[1]}`;
    Object.preventExtensions(this);
  }

  toCytoscapeEdge(colorScale) {
    return {
      data: {
        element: this,
        ...this,
        color: getHexColor(colorScale, this.criticality),
      },
      classes: ["label"],
    };
  }

  generateSelectedAssetFeatures(assets, colorScale, maxCriticality) {
    const { source, target } = this.#lookupAssets(assets);

    const sourceFeature = source.createSelectedAssetFeature(colorScale, maxCriticality, false);
    const targetFeature = target.createSelectedAssetFeature(colorScale, maxCriticality, false);
    return [sourceFeature, targetFeature];
  }

  generateSelectedSegmentFeatures(assets, colorScale) {
    const { source, target } = this.#lookupAssets(assets);
    const sourceFeature = source.createSelectedSegmentFeature(colorScale);
    const targetFeature = target.createSelectedSegmentFeature(colorScale);
    return [sourceFeature, targetFeature];
  }

  #lookupAssets(assets) {
    const source = findAsset(assets, this.source);
    const target = findAsset(assets, this.target);
    return { source, target };
  }

  generateSelectedConnectionFeature(assets, colorScale) {
    const { source, target } = this.#lookupAssets(assets);
    return source.createSelectedConnectionFeature(target, this.criticality, colorScale);
  }

  generateDetails(allAssets, colorScale, cxnCriticalityColorScale) {
    const assets = this.#lookupAssets(allAssets);
    if (assets.source && assets.target) {
      const { source, target } = assets;
      return {
        uri: this.id,
        title: `${source.name} (${source.label}) to ${target.name} (${target.label})`,
        criticality: this.criticality,
        color: getHexColor(cxnCriticalityColorScale, this.criticality),
        connectedAssets: [
          source.createConnectedAssets(source, this.criticality, colorScale),
          target.createConnectedAssets(target, this.criticality, colorScale),
        ],
        elementType: "connection",
      };
    }
    return {};
  }
}
