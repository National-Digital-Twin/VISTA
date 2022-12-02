import { getColorScale, getHexColor, getURIFragment } from "utils";

export default class Dependency {
  #colorScale = getColorScale(1, 3);

  constructor({
    uri,
    criticality,
    dependentNode,
    dependentType,
    providerNode,
    providerType,
    osmID,
  }) {
    this.uri = uri;
    this.id = `${getURIFragment(dependentNode)} - ${getURIFragment(providerNode)}`;
    this.criticality = criticality;
    this.criticalityColor = getHexColor(this.#colorScale, criticality);
    this.dependent = {
      uri: dependentNode,
      type: dependentType,
    };
    this.provider = {
      uri: providerNode,
      type: providerType,
    };
    this.osmID = osmID;
  }

  toCytoscapeEdge() {
    return {
      data: {
        id: this.uri,
        label: this.id,
        source: this.dependent.uri,
        target: this.provider.uri,
        color: this.criticalityColor
      },
      classes: ["label"],
    };
  }
}
