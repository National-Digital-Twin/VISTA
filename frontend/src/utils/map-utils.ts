import type { Feature } from 'geojson';
import { isEmpty } from '@/utils/isEmpty';
import type { Asset, Dependency, Element } from '@/models';

export function generatePointAssetFeatures(assets: Asset[], dependencies: Dependency[], selectedElements: Element[]): Feature[] {
    const pointAssets = assets
        .filter((asset) => asset.lat && asset.lng)
        .map((asset) => {
            return asset.createPointAsset();
        })
        .filter((feature) => feature !== null);

    const pointAssetDependencies = dependencies
        .map((dependency) => {
            return dependency.createLineFeature(assets, selectedElements);
        })
        .filter((feature) => feature !== null);
    return [...pointAssetDependencies, ...pointAssets];
}

export function generateLinearAssetFeatures(assets: Asset[], selectedElements: Element[]): Feature[] {
    const linearAssets = assets
        .filter((asset) => !isEmpty(asset.geometry))
        .map((asset) => asset.createLinearAsset(selectedElements))
        .filter((feature) => feature !== null);

    return linearAssets;
}
