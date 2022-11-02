import { Asset, Connection } from "../../models";

const getConnections = (connections) =>
  connections.map(
    (connection) =>
      new Connection({
        id: connection?.connUri,
        criticality: connection?.criticality,
        source: connection?.asset1Uri,
        target: connection?.asset2Uri,
      })
  );

const createAssetConnections = async (assets, connections, get) => {
  return await Promise.all(
    assets.map(async (asset, index) => {
      const isSource = (cxn) => cxn.source === asset.uri || cxn.target === asset.uri;
      const cxns = connections.filter(isSource).map((cxn) => {
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

      let segments = [];
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
        segments: segments,
      });
    })
  );
};

export const createData = async (assetsMetadata, connectionsMetadata, get) => {
  const connections = getConnections(connectionsMetadata);
  const assets = await createAssetConnections(assetsMetadata, connections, get);

  return { assets, connections };
};
