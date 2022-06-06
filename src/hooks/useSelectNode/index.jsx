import { useContext } from "react";
import { AssetContext } from "../../AssetContext";
import useFetch from "use-http";
import config from "../../config/app-config";

const typesWithParts = ["road"];
const getItemById = (items, id) => items.find((item) => item.uri === id);

const setAssetSegments = async (get, asset) => {
  console.log(asset);
  const matched = !!typesWithParts.find((part) =>
    asset.type.toLowerCase().includes(part)
  );

  if (!matched) return;

  const pathSegments = await get(`/assets/${asset.id}/parts`);

  const segments = Object.values(pathSegments);
  const lats = segments.map((segment) => segment.lat[0]);
  const lons = segments.map((segment) => segment.lon[0]);

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
      const asset = getItemById(assets, id);
      await setAssetSegments(get, asset);
    }

    if (type === "connection") {
      const connection = getItemById(connections, id);
      await setConnectionSegments(get, connection);
    }

    onSelectedNode(id, type);
  };

  return [setSelectedNode];
};

export default useSelectNode;
