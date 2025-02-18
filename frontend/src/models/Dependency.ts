import type { Feature } from "geojson";
import type Asset from "./Asset";
import { isEmpty } from "@/utils/isEmpty";
import {
  findElement,
  getColorScale,
  getHexColor,
  getURIFragment,
} from "@/utils";
import type { ElementLike } from "@/utils";

export default class Dependency {
  readonly #colorScale = getColorScale(1, 3);

  uri: string;
  id: string;
  criticality: number;
  criticalityColor: string;
  dependent: {
    uri: string;
    name: string;
    type: string;
  };
  provider: {
    uri: string;
    name: string;
    type: string;
  };
  osmID: string;
  elementType: "dependency";
  isDependency: true;

  constructor({ uri, criticality, dependent, provider, osmID }) {
    this.uri = uri;
    this.id = `${getURIFragment(dependent.uri)} - ${getURIFragment(provider.uri)}`;
    this.criticality = criticality;
    this.criticalityColor = getHexColor(this.#colorScale, criticality);
    this.dependent = dependent;
    this.provider = provider;
    this.osmID = osmID;
    this.elementType = "dependency";
    this.isDependency = true;
    Object.preventExtensions(this);
  }

  #lookupConnectedAssets(assets: Asset[]) {
    const source = findElement(assets, this.dependent.uri);
    const target = findElement(assets, this.provider.uri);
    return { source, target };
  }

  generateCoordinates(assets: Asset[]) {
    const { source, target } = this.#lookupConnectedAssets(assets);
    if (!source || !target || !source.hasLatLng || !target.hasLatLng) {
      return [];
    }
    return [
      [source.lng, source.lat],
      [target.lng, target.lat],
    ];
  }

  createLineFeature<T extends ElementLike>(
    assets: Asset[],
    selectedElements: T[],
  ): Feature | null {
    const coordinates = this.generateCoordinates(assets);

    if (isEmpty(coordinates)) {
      return null;
    }

    const selected = selectedElements.some(
      (selectedElement) => selectedElement.uri === this.uri,
    );
    return {
      type: "Feature",
      properties: {
        uri: this.uri,
        id: this.id,
        criticality: this.criticality,
        lineColor: this.criticalityColor,
        lineWidth: selected ? 4 : 3,
        dependent: this.dependent.uri,
        provider: this.provider.uri,
        selected,
      },
      geometry: {
        type: "LineString",
        coordinates,
      },
    };
  }

  getDetails(dependentName: string, providerName: string) {
    return {
      title: `${dependentName} - ${providerName}`,
      criticality: this.criticality,
      id: this.id,
      uri: this.uri,
      elementType: this.elementType,
      icon: {
        style: {
          width: "1rem",
          height: "0.125rem",
          backgroundColor: this.criticalityColor,
        },
      },
    };
  }
}
