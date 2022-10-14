import ColorScale from "color-scales";
import Asset from "../../models/Asset";
import Connection from "../../models/Connection";

const getConnections = (connections) =>
  connections.map(
    (connection) =>
      new Connection({
        uri: connection?.connUri,
        criticality: connection?.criticality,
        source: connection?.asset1Uri,
        target: connection?.asset2Uri,
      })
  );

const createAssetConnections = async (assets, connections, get) => {
  return await Promise.all(
    assets.map(async (asset, index) => {
      const cxns = connections
      .filter((cxn) => cxn.source === asset.uri || cxn.target === asset.uri)
      .map((cxn) => {
        let source = cxn.source;
        let target = cxn.target;

        if (cxn.target === asset.uri) {
          source = cxn.target;
          target = cxn.source;
        }

        return {
          ...cxn,
          source,
          target,
        };
      });

      let segments = []
      if (asset?.type.toLowerCase().includes("road")) {
        const pathSegments = await get(`/assets/${asset.id}/parts`);
        segments = Object.values(pathSegments);
      }

      return new Asset({
        id: asset?.uri,
        label: asset?.id,
        name: asset?.name,
        type: asset?.type,
        description: asset?.desc,
        lat: asset?.lat,
        lng: asset?.lon,
        gridIndex: index + 1,
        connections: cxns,
        segments: segments
      });
    })
  );
};

const getColorScale = (min, max) =>
  new ColorScale(min, max === 0 ? 100 : max, ["#35C035", "#FFB60A", "#FB3737"], 1);

const getAllTotalCxns = (assets) => assets.map((asset) => asset.totalCxns);

const getAllCriticalities = (assets) => assets.map((asset) => asset.criticality);

export const createData = async (assets, connectionsMetadata, get) => {
  const connections = getConnections(connectionsMetadata);
  const assetCxns = await createAssetConnections(assets, connections, get);
  const maxAssetCriticality = Math.max(...getAllCriticalities(assetCxns));
  const minAssetCriticality = Math.min(...getAllCriticalities(assetCxns));
  const maxAssetTotalCxns = Math.max(...getAllTotalCxns(assetCxns));
  const minAssetTotalCxns = Math.min(...getAllTotalCxns(assetCxns));

  return {
    assetCriticalityColorScale: getColorScale(
      minAssetCriticality,
      maxAssetCriticality
    ),
    assets: assetCxns,
    connections,
    cxnCriticalityColorScale: getColorScale(1, 3),
    maxAssetCriticality,
    maxAssetTotalCxns,
    totalCxnsColorScale: getColorScale(minAssetTotalCxns, maxAssetTotalCxns),
  };
};
