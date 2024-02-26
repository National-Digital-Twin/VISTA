import ColorScale from "color-scales";
import { isEmpty, lowerCase } from "lodash";
import { prefixLookup } from "../config/uri-prefix";

/**
 * IsEmpty
 * @param {any} input
 * @returns {boolean}
 */
export const IsEmpty = (input) => !input || input.length === 0 || Object.keys(input).length === 0;

export const findElement = (assets, uri) => assets?.find((asset) => asset.uri === uri);
export const isElementCached = (assets, uri) => assets?.some((asset) => asset.uri === uri);

export const getHexColor = (colorScale, value) => {
  if (isEmpty(colorScale)) return undefined;
  return colorScale.getColor(value).toHexString();
};
export const isAsset = (element) => element?.elementType === "asset" ?? false;
export const isDependency = (element) => element?.elementType === "dependency" ?? false;

export const getShortType = (type) => {
  if (type) {
    const URLFragments = type.split("#");
    if (URLFragments.length === 2) {
      const prefix = prefixLookup[URLFragments[0]];
      const name = lowerCase(URLFragments[1]);
      return prefix + name;
    }
    return type;
  }
  return type;
};

export const getURIFragment = (uri) => {
  if (uri) {
    const uriParts = uri.split("#");
    return uriParts.length > 1 ? uriParts[1] : uri;
  }
  return uri;
};

export const getColorScale = (min, max) => {
  return new ColorScale(min, max === 0 ? 100 : max, ["#35C035", "#FFB60A", "#FB3737"], 1);
};

export const getIconStyle = (styles) => {
  if (isEmpty(this.styles)) {
    return {
      iconLabel: this.primaryType.substring(0, 3),
      color: "#F2F2F2",
      backgroundColor: "#272727",
    };
  }

  return {
    iconLabel: this.styles.iconFallbackText,
    // icon: this.styles?.faIcon || undefined,
    color: this.styles?.color || "#F2F2F2",
    backgroundColor: this.styles?.backgroundColor || "#272727",
  };
};

export const getUniqueElements = (elements) => {
  const uniqueElements = elements.reduce((acc, current) => {
    const isAdded = acc.find((element) => element.uri === current.uri);
    if (isAdded) {
      return acc;
    } else {
      return acc.concat([current]);
    }
  }, []);
  return uniqueElements;
};
