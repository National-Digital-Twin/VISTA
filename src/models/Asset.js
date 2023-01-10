import { isEmpty } from "lodash";
import { getColorScale, getHexColor } from "utils";

export default class Asset {
  #countColorScale = {};
  #criticalitySumColorScale = {};
  constructor({ uri, type, lat, lng, geometry, dependent }) {
    this.uri = uri;
    this.id = this.uri.split("#")[1];
    this.type = type;
    this.lat = lat;
    this.lng = lng;
    this.geometry = geometry;
    this.dependent = dependent;
    this.elementType = "asset";
    Object.preventExtensions(this);
  }

  /**
   * @param {number} min
   * @param {number} max
   */
  setCountColorScale(min, max) {
    if (min === max) {
      this.#countColorScale = getColorScale(0, 1);
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
      this.#criticalitySumColorScale = getColorScale(0, 1);
      return;
    }
    this.#criticalitySumColorScale = getColorScale(min, max);
  }

  get criticalityColor() {
    return getHexColor(this.#criticalitySumColorScale, this.dependent.criticalitySum);
  }

  get isPointAsset() {
    return !this.hasGeometry();
  }

  get isLinearAsset() {
    return this.hasGeometry();
  }

  toCytoscapeNode() {
    return {
      data: {
        element: this,
        id: this.uri,
        label: this.id,
      },
      classes: ["label", this.id.charAt(0)],
    };
  }

  #isSelected(selectedElements) {
    return selectedElements.some((selectedElement) => selectedElement.uri === this.uri);
  }

  hasLatLng() {
    return Boolean(this.lat && this.lng);
  }

  hasGeometry() {
    return !isEmpty(this.geometry);
  }

  createPointAsset(selectedElements) {
    if (!this.lat && !this.lng) return {};

    const selected = this.#isSelected(selectedElements);
    return {
      type: "Feature",
      properties: {
        uri: this.uri,
        id: this.id,
        criticality: this.dependent.criticalitySum,
        circleColor: selected ? this.criticalityColor : "#333",
        circleStrokeWidth: selected ? 2 : 1,
      },
      geometry: {
        type: "Point",
        coordinates: [this.lng, this.lat],
      },
    };
  }

  createSegmentCoords() {
    const lats = this.geometry.map((segment) => parseFloat(segment.lat1));
    const lngs = this.geometry.map((segment) => parseFloat(segment.lon1));
    return lngs.map((lng, index) => [lng, lats[index]]);
  }

  createLinearAsset(selectedElements) {
    const selected = this.#isSelected(selectedElements);
    return {
      type: "Feature",
      properties: {
        uri: this.uri,
        id: this.id,
        criticality: this.dependent.criticalitySum,
        lineColor: selected ? this.criticalityColor : "#7C7C7C",
      },
      geometry: {
        type: "LineString",
        coordinates: this.createSegmentCoords(),
      },
    };
  }
}
