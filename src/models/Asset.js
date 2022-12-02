import { getColorScale, getHexColor } from "utils";

export default class Asset {
  #countColorScale = {};
  #criticalitySumColorScale = {};
  constructor({ uri, type, lat, lng, segments, dependentCount, dependentCriticalitySum }) {
    this.uri = uri;
    this.id = this.uri.split("#")[1];
    this.type = type;
    this.lat = lat;
    this.lng = lng;
    this.segments = segments;
    this.dependent = {
      count: dependentCount,
      criticalitySum: dependentCriticalitySum,
    };
  }

  /**
   * @param {number} min
   * @param {number} max
   */
  setCountColorScale(min, max) {
    if (min === max) {
      this.#countColorScale = {};
      return;
    }
    this.#countColorScale = getColorScale(min, max);
  }

  get countColor() {
    return getHexColor(this.#countColorScale, this.dependent.count);
  }

  /**
   * @param {number} min
   * @param {number} max
   */
  setCriticalitySumColorScale(min, max) {
    if (min === max) {
      this.#criticalitySumColorScale = {};
      return;
    }
    this.#criticalitySumColorScale = getColorScale(min, max);
  }

  get criticalitySumColor() {
    return getHexColor(this.#criticalitySumColorScale, this.dependent.criticalitySum);
  }

  toCytoscapeNode() {
    return {
      data: {
        id: this.uri,
        label: this.id,
      },
      classes: ["label", this.id.charAt(0)],
    };
  }

  createPointAsset(color) {
    if (!this.lat && !this.lng) return {};
    return {
      type: "Feature",
      properties: {
        element: { ...this },
        color: color ?? this.criticalitySumColor,
        size: 4,
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

  createLinearAsset(color) {
    return {
      type: "Feature",
      properties: {
        element: this,
        color: color ?? this.criticalitySumColor,
      },
      geometry: {
        type: "LineString",
        coordinates: this.#createSegmentCoords(),
      },
    };
  }
}
