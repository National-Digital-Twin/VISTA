import { prefixLookup } from "../config/uri-prefix";

/**
 * IsEmpty
 * @param {any} input
 * @returns {boolean}
 */
export const IsEmpty = (input) => !input || input.length === 0 || Object.keys(input).length === 0;

export const findAsset = (assets, uri) => assets?.find((asset) => asset.id === uri);
export const getHexColor = (colorScale, value) => colorScale?.getColor(value).toHexString();
export const isAsset = (element) => element.elementType === "asset";

export const getShortType = (type) => {
  if (type) {
    const URLFragments = type.split("#");
    if (URLFragments.length === 2) {
      const prefix = prefixLookup[URLFragments[0]];
      const name = `${prefix}${URLFragments[1]}`;
      return name;
    }
    return type;
  }
  return type;
};
