import { AssetSpecification } from "@/hooks/queries/dataset-utils";

export async function fetchAssetSpecifications() {
  // const staticAssetSpecifications = (
  //   await import("@/data/coeff-assets-with-geometry.json")
  // ).default as any[];

  const liveAssetSpecifications: AssetSpecification[] = (
    await import("@/data/live-assets.json")
  ).default as AssetSpecification[];

  return liveAssetSpecifications;
}
