import type { Feature, Geometry, Position } from "geojson";
import type ColorScale from "color-scales";
import {
  AssetClassification,
  AssetClassificationsByType,
} from "./AssetClassification";
import type { FoundIcon } from "@/hooks/useFindIcon";

import type { ElementLike } from "@/utils";
import { isEmpty } from "@/utils/isEmpty";
import {
  getColorScale,
  getHexColor,
  getShortType,
  getURIFragment,
} from "@/utils";

export interface AssetGeometryNode {
  uri: string;
  type: string;
  /* The following are all numbers stored as strings */
  lat1: string;
  lon1: string;
  lat2: string;
  lon2: string;
}

export enum AssetState {
  Live,
  Static,
}

export default class Asset {
  #countColorScale: ColorScale | null = null;
  #criticalitySumColorScale: ColorScale | null = null;
  #classificationColorScale: ColorScale | null = null;
  #addresses: string[] = [];

  uri: string;
  id: string;
  type: string;
  name?: string;
  lat: number | undefined;
  lng: number | undefined;
  geometry: Geometry;
  dependent: any;
  description: string;
  styles: FoundIcon;
  elementType: "asset";
  primaryCategory?: string;
  secondaryCategory?: string;
  state: AssetState = AssetState.Static;
  classification?: string;

  constructor({
    uri,
    type,
    name,
    lat,
    lng,
    geometry,
    dependent,
    description,
    styles,
    primaryCategory,
    secondaryCategory,
    state,
    classification,
  }: {
    uri: string;
    type: string;
    name?: string;
    lat?: number;
    lng?: number;
    geometry: Geometry;
    dependent: any;
    description: string;
    styles: FoundIcon;
    primaryCategory?: string;
    secondaryCategory?: string;
    state: AssetState;
    classification?: string;
  }) {
    this.uri = uri;
    this.id = this.uri.split("#")[1];
    this.type = type;
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.geometry = geometry;
    this.dependent = dependent;
    this.description = description;
    this.styles = styles;
    this.elementType = "asset";
    this.primaryCategory = primaryCategory;
    this.secondaryCategory = secondaryCategory;
    this.state = state ?? AssetState.Static;
    this.classification = classification;
    Object.preventExtensions(this);
  }

  setCountColorScale(min: number, max: number) {
    if (min === max) {
      this.#countColorScale = getColorScale(0, 1);
      return;
    }
    this.#countColorScale = getColorScale(min, max);
  }

  get countColor() {
    return getHexColor(this.#countColorScale, this.dependent.count);
  }

  setCriticalitySumColorScale(min: number, max: number) {
    if (min === max) {
      this.#criticalitySumColorScale = getColorScale(0, 1);
      return;
    }
    this.#criticalitySumColorScale = getColorScale(min, max);
  }

  get typeClassificationPriorityMap() {
    const classifications = AssetClassificationsByType[this.type];
    return classifications.map((c) => c.priority);
  }

  setClassificationColorScale() {
    if (this.type in AssetClassificationsByType) {
      const max = Math.max(...this.typeClassificationPriorityMap);
      const min = Math.min(...this.typeClassificationPriorityMap);
      this.#classificationColorScale = getColorScale(min, max);
    }
  }

  get criticalityColor() {
    if (this.assetClassificationPriority && this.#classificationColorScale) {
      return getHexColor(
        this.#classificationColorScale,
        this.assetClassificationPriority,
      );
    } else {
      return getHexColor(
        this.#criticalitySumColorScale,
        this.dependent.criticalitySum,
      );
    }
  }

  get assetClassification(): AssetClassification | undefined {
    const classifications = AssetClassificationsByType[this.type];
    return classifications?.find((c) => c.id === this.classification);
  }

  get assetClassificationPriority(): number | undefined {
    return this.assetClassification?.priority;
  }

  get shortType() {
    return getShortType(this.type);
  }

  get primaryType() {
    return getURIFragment(this.type);
  }

  /**
   * @param {string[]} addresses
   */
  setAddresses(addresses: string[]) {
    this.#addresses = addresses;
  }

  get addresses() {
    return this.#addresses;
  }

  getIconStyle() {
    return {
      // Need to add this back in once the icon data is fixed
      // icon: this.styles?.faIcon,
      color: this.styles.color,
      backgroundColor: this.styles.backgroundColor,
      iconLabel: this.styles.iconFallbackText,
    };
  }

  #isSelected<T extends ElementLike>(selectedElements: T[]) {
    return selectedElements.some(
      (selectedElement) => selectedElement.uri === this.uri,
    );
  }

  get hasLatLng() {
    const hasCoords = Boolean(this.lat && this.lng);
    return hasCoords;
  }

  hasGeometry() {
    return !isEmpty(this.geometry);
  }

  createPointAsset(): Feature | null {
    if (!this.lat || !this.lng) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        uri: this.uri,
        id: this.id,
        criticality: this.dependent.criticalitySum,
        type: this.type,
      },
      geometry: {
        type: "Point",
        coordinates: [this.lng, this.lat],
      },
    };
  }

  createSegmentCoords(): Position[][] {
    if (this.geometry.type === "MultiLineString") {
      return this.geometry.coordinates;
    } else if (this.geometry.type === "LineString") {
      return [this.geometry.coordinates];
    } else {
      return [];
    }
  }

  getLinearGeometry(): Geometry {
    if (this.geometry.type === "LineString") {
      return {
        type: "LineString",
        coordinates: this.geometry.coordinates as Position[],
      };
    } else if (this.geometry.type === "MultiLineString") {
      return {
        type: "MultiLineString",
        coordinates: this.geometry.coordinates as Position[][],
      };
    } else {
      return this.geometry;
    }
  }

  createLinearAsset<T extends ElementLike>(
    selectedElements: T[],
  ): Feature | null {
    const geometry: Geometry = this.getLinearGeometry();
    if (
      this.geometry.type === "MultiLineString" ||
      this.geometry.type === "LineString"
    ) {
      const selected = this.#isSelected(selectedElements);

      return {
        type: "Feature",
        properties: {
          uri: this.uri,
          id: this.id,
          criticality: this.dependent.criticalitySum,
          lineColor: this.criticalityColor,
          lineWidth: selected ? 4 : 3,
          selected,
        },
        geometry: geometry,
      };
    }
    return null;
  }

  getDetails(assetInfo) {
    return {
      title: assetInfo?.name ?? this.name ?? "Name unknown",
      criticality: this.dependent.criticalitySum,
      type: assetInfo?.assetType ?? this.type,
      desc: assetInfo?.desc ?? this.description,
      criticalityColor: this.criticalityColor,
      id: this.id,
      uri: this.uri,
      elementType: this.elementType,
    };
  }
}
