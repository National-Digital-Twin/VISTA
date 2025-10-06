import { AssetSpecification } from '@/hooks/queries/dataset-utils';

export async function fetchAssetSpecifications() {
    const liveAssetSpecifications: AssetSpecification[] = (await import('@/data/live-assets.json')).default as AssetSpecification[];

    return liveAssetSpecifications;
}
