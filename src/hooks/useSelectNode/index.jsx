import { useContext } from "react";
import { AssetContext } from "../../AssetContext";
import useFetch from "use-http";
import config from "../../config/app-config";

const typesWithParts = ["road"];

const setAssetSegments = async (get, asset) => {
  const matched = !!typesWithParts.find((part) =>
    asset.type.toLowerCase().includes(part)
  );

  if (!matched) return;

  const pathSegments = await get(`/assets/${asset.id}/parts`);

  const segments = Object.values(pathSegments);
  const lats = segments.map((segment) => segment.lat).flat();
  const lons = segments.map((segment) => segment.lon).flat();

  asset.appendLatitude(lats);
  asset.appendLongitude(lons);
};

const setConnectionSegments = async (get, connection) => {
  connection.sourceAsset &&
    (await setAssetSegments(get, connection.sourceAsset));
  connection.targetAsset &&
    (await setAssetSegments(get, connection.targetAsset));
};

const useSelectNode = (assets, connections) => {
  const { onSelectedNode } = useContext(AssetContext);
  const { get } = useFetch(config.api.url);
  const setSelectedNode = async (id, type) => {
    if (type === "asset") {
      const asset = assets.find((asset) => asset.uri === id);
      setAssetSegments(get, asset);
    }

    if (type === "connection") {
      const connection = connections.find(
        (connection) => connection.uri === id
      );
      setConnectionSegments(get, connection);
    }

    onSelectedNode(id, type);
  };

  return [setSelectedNode];
};

export default useSelectNode;
