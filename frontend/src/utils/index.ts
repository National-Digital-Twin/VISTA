export { isEmpty } from './isEmpty';
export type { ElementLike } from './elementUtils';
export { findElement, isAsset } from './elementUtils';
export { getURIFragment } from './uriUtils';
export { getColorScale, getHexColor } from './colorUtils';
export { createPointFeature, createLinearFeature, formatAssetDetails, getLinearGeometry } from './assetUtils';
export type { AssetDetails } from './assetUtils';

export const percentage = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);
export const singularize = (name: string): string => name.replace(/s$/i, '');
