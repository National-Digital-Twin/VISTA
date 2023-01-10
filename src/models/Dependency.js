import { isEmpty } from "lodash";
import { findAsset, getColorScale, getHexColor, getURIFragment } from "utils";

export default class Dependency {
  #colorScale = getColorScale(1, 3);

  constructor({ uri, criticality, dependent, provider, osmID }) {
    this.uri = uri;
    this.id = `${getURIFragment(dependent.uri)}_depends_on_${getURIFragment(provider.uri)}`;
    this.criticality = criticality;
    this.criticalityColor = getHexColor(this.#colorScale, criticality);
    this.dependent = dependent;
    this.provider = provider;
    this.osmID = osmID;
    this.elementType = "dependency";
    this.isDependency = true;
    Object.preventExtensions(this);
  }

  toCytoscapeEdge() {
    return {
      data: {
        element: this,
        id: this.uri,
        label: this.id,
        source: this.dependent.uri,
        target: this.provider.uri,
        color: this.criticalityColor,
      },
      classes: ["label"],
    };
  }

  #lookupConnectedAssets(assets) {
    const source = findAsset(assets, this.dependent.uri);
    const target = findAsset(assets, this.provider.uri);
    return { source, target }
  }

  #hasLatLng(source, target) {
    if (source?.lat && source?.lng && target?.lat && target?.lng) return true;
    return false;
  }

  generateCoordinates(assets) {
    const { source, target } = this.#lookupConnectedAssets(assets);
    if (!this.#hasLatLng(source, target)) return [];
    return [
      [source.lng, source.lat],
      [target.lng, target.lat],
    ];
  }

  createLineFeature(assets, selectedElements) {
    const coordinates = this.generateCoordinates(assets);

    if (isEmpty(coordinates)) return {};

    const selected = selectedElements.some((selectedElement) => selectedElement.uri === this.uri);
    return {
      type: "Feature",
      properties: {
        uri: this.uri,
        id: this.id,
        criticality: this.criticality,
        lineColor: this.criticalityColor,
        lineOpacity: selected ? 1 : 0.3,
      },
      geometry: {
        type: "LineString",
        coordinates,
      },
    };
  }
}
