import { getColorScale, getHexColor } from "utils";

export default class Asset {
  #countColorScale = {};
  #criticalitySumColorScale = {};
  constructor({ uri, type, name, lat, lng, dependentCount, dependentCriticalitySum }) {
    this.uri = uri;
    this.id = this.uri.split("#")[1];
    this.type = type;
    this.name = name;
    this.lat = lat;
    this.lng = lng;
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
        element: { ...this },
        id: this.uri,
        label: this.id,
      },
      classes: ["label", this.id.charAt(0)],
    };
  }

  toGrid() {
    return {
      ...this,

    }
  }

  createPointAsset() {
    if (!this.lat && !this.lng) return {};
    return {
      type: "Feature",
      properties: {
        element: { ...this },
        color: "#333",
        size: 4,
      },
      geometry: {
        type: "Point",
        coordinates: [this.lng, this.lat],
      },
    };
  }
}
