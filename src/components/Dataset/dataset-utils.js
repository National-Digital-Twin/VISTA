import { Asset, Dependency } from "models";

const getDepedencies = (dependencies) => {
  if (!dependencies && !Array.isArray(dependencies)) return [];
  return dependencies.map(
    (dependency) =>
      new Dependency({
        uri: dependency.dependencyUri,
        criticality: dependency.criticalityRating,
        dependentNode: dependency.dependentNode,
        dependentType: dependency.dependentType,
        providerNode: dependency.providerNode,
        providerType: dependency.providerNodeType,
        osmID: dependency.osmID,
      })
  );
};

// const createAssetConnections = async (assets, connections, get, response) => {
//   if (!assets && !Array.isArray(assets)) return [];
//   return await Promise.all(
//     assets.map(async (asset, index) => {
//       let cxns = [];
//       if (connections && Array.isArray(connections)) {
//         const isSource = (cxn) => cxn.source === asset.uri || cxn.target === asset.uri;
//         cxns = connections.filter(isSource).map((cxn) => {
//           let source = cxn.source;
//           let target = cxn.target;

//           if (cxn.target === asset.uri) {
//             source = cxn.target;
//             target = cxn.source;
//           }

//           return {
//             ...cxn,
//             source,
//             target,
//           };
//         });
//       }

//       let segments = [];
//       if (asset?.type.toLowerCase().includes("road")) {
//         const pathSegments = await get(`/assets/${asset.id}/parts`);
//         if (response.ok) segments = Object.values(pathSegments);
//       }

//       return new AssetOld({
//         id: asset?.uri,
//         label: asset?.id,
//         name: asset?.name,
//         type: asset?.type,
//         description: asset?.desc,
//         lat: asset?.lat,
//         lng: asset?.lon,
//         gridIndex: index + 1,
//         connections: cxns,
//         segments: segments,
//       });
//     })
//   );
// };

const getAssets = (assets) => {
  if (!assets && !Array.isArray(assets)) return [];

  return assets.map(
    (asset) =>
      new Asset({
        uri: asset.uri,
        type: asset.type,
        lat: asset.lat,
        lng: asset.lon,
        dependentCount: asset.dependentCount,
        dependentCriticalitySum: asset.dependentCriticalitySum,
      })
  );
};

export const createData = (assets, dependencies) => {
  return { assets: getAssets(assets), dependencies: getDepedencies(dependencies) };
};
