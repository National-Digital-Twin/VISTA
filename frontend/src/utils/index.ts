// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export { isEmpty } from './isEmpty';
export type { ElementLike } from './elementUtils';
export { findElement, isAsset } from './elementUtils';
export { getURIFragment } from './uriUtils';
export { getColorScale, getHexColor } from './colorUtils';
export { createPointFeature, createLinearFeature, formatAssetDetails, getLinearGeometry } from './assetUtils';
export type { AssetDetails } from './assetUtils';

export const percentage = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);
export const singularize = (name: string): string => name.replace(/s$/i, '');
export const pluralize = (name: string, count: number): string => (count === 1 ? name : `${name}s`);
