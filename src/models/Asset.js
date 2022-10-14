import { findAsset, getHexColor } from "../utils";

const MAX_CIRCLE_SIZE = 10;
const MIN_CIRCLE_SIZE = 5;

export default class Asset {
  constructor({ id, label, name, description, lat, lng, type, gridIndex, connections, segments }) {
    this.id = id;
    this.label = label;
    this.name = name;
    this.description = description;
    this.lat = parseFloat(lat);
    this.lng = parseFloat(lng);
    this.type = type;
    this.gridIndex = gridIndex;
    this.connections = connections;
    this.criticality = this.#calculateCriticality();
    this.segments = segments;
    Object.preventExtensions(this);
  }

  #calculateCriticality() {
    return this.connections.reduce((total, cxn) => total + cxn.criticality, 0);
  }

  get totalCxns() {
    return this.connections.length;
  }

  toCytoscapeNode() {
    return {
      data: {
        element: this,
        id: this.id,
        label: this.label,
      },
      classes: ["label", this.label.charAt(0)],
    };
  }

  createMapAsset() {
    return {
      type: "Feature",
      properties: {
        element: this,
        color: "#333",
        size: 4,
        pointType: "asset",
      },
      geometry: {
        type: "Point",
        coordinates: [this.lng, this.lat],
      },
    };
  }

  #createSegmentCoords() {
    const lats = this.segments.map((segment) => parseFloat(segment.lat[0]));
    const lngs = this.segments.map((segment) => parseFloat(segment.lon[0]));
    return lngs.map((lng, index) => [lng, lats[index]]);
  }

  #lookupTargetConnection(assets) {
    return this.connections.map((connection) => ({
      ...connection,
      target: findAsset(assets, connection.target),
    }));
  }

  createSelectedAssetFeature(colorScale, maxCriticality, isSource) {
    const r = this.criticality / maxCriticality;
    let circumference = Math.ceil(Math.PI * 2 * r);
    if (circumference > MAX_CIRCLE_SIZE) {
      circumference = MAX_CIRCLE_SIZE;
    } else if (circumference < MIN_CIRCLE_SIZE) {
      circumference = MIN_CIRCLE_SIZE;
    }

    return {
      type: "Feature",
      properties: {
        color: getHexColor(colorScale, this.criticality),
        size: circumference,
        pointType: "asset",
        selected: isSource ? "source" : "target",
      },
      geometry: {
        type: "Point",
        coordinates: [this.lng, this.lat],
      },
    };
  }

  generateSelectedAssetFeatures(assets, colorScale, maxCriticality) {
    const sourceFeature = this.createSelectedAssetFeature(colorScale, maxCriticality, true);
    const targetFeatures = this.#lookupTargetConnection(assets).map(({ target }) => {
      return target.createSelectedAssetFeature(colorScale, maxCriticality, false);
    });
    return [sourceFeature, ...targetFeatures];
  }

  createSelectedSegmentFeature(colorScale) {
    return {
      type: "Feature",
      properties: {
        color: getHexColor(colorScale, this.criticality),
      },
      geometry: {
        type: "LineString",
        coordinates: this.#createSegmentCoords(),
      },
    };
  }

  generateSelectedSegmentFeatures(assets, colorScale) {
    if (this.segments.length > 0) {
      const sourceFeature = this.createSelectedSegmentFeature(colorScale);
      return [sourceFeature];
      // const targetFeatures = this.#lookupTargetConnection(assets).map(({ target, criticality }) => {
      //   return target.createSelectedSegmentFeature(criticality, colorScale);
      // });
      // return [sourceFeature, ...targetFeatures];
    }
    return [];
  }

  createSelectedConnectionFeature(target, criticality, colorScale) {
    if (this.lng && this.lat && target.lng && target.lat) {
      return {
        type: "Feature",
        properties: {
          color: getHexColor(colorScale, criticality),
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [this.lng, this.lat],
            [target.lng, target.lat],
          ],
        },
      };
    }
    return {};
  }

  generateSelectedConnectionFeature(assets, colorScale) {
    return this.#lookupTargetConnection(assets).map(({ target, criticality }) =>
      this.createSelectedConnectionFeature(target, criticality, colorScale)
    );
  }

  createConnectedAssets(asset, cxnCriticality, colorScale) {
    return {
      uri: asset.id,
      title: `${asset.name} (${asset.label})`,
      assetCriticality: asset.criticality,
      cxnCriticality,
      color: getHexColor(colorScale, asset.criticality),
    };
  }

  #generateConnectedAssets(assets, colorScale) {
    return this.#lookupTargetConnection(assets).map(({ target, criticality }) =>
      this.createConnectedAssets(target, criticality, colorScale)
    );
  }

  generateDetails(assets, colorScale) {
    return {
      uri: this.id,
      title: `${this.name} (${this.label})`,
      criticality: this.criticality,
      type: this.type,
      description: this.description,
      lat: this.lat,
      lng: this.lng,
      color: getHexColor(colorScale, this.criticality),
      connectedAssets: this.#generateConnectedAssets(assets, colorScale),
      elementType: "asset",
    };
  }
}
