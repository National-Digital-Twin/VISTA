import { useContext } from "react";
import { AssetContext } from "../../AssetContext";
import useFetch from "use-http";
import config from "../../config/app-config";

const useSelectNode = (assets, connections) => {
  const { onSelectedNode } = useContext(AssetContext);
  const { get } = useFetch(config.api.url);

  const typesWithParts = ["road"];
  const getItemById = (items, id) => items.find((item) => item.uri === id);

  const setAssetSegments = async (get, asset) => {
    if (
      !asset ||
      !asset.type ||
      !asset.type.toLowerCase().includes(typesWithParts)
    )
      return;

    // only get segments if they have not been retrieved already
    if (asset.lat.length < 2) {
      const pathSegments = await get(`/assets/${asset.id}/parts`);
      const segments = Object.values(pathSegments);
      const lats = segments.map((segment) => segment.lat[0]);
      const lons = segments.map((segment) => segment.lon[0]);

      asset.setPath(lats, lons);
    }
  };

  const setConnectionSegments = async (get, connection) => {
    const { sourceAsset, targetAsset } = connection;
    sourceAsset && (await setAssetSegments(get, sourceAsset));
    targetAsset && (await setAssetSegments(get, targetAsset));
  };

  const setSelectedNode = async (id, type) => {
    if (type === "asset") {
      const item = getItemById(assets, id);
      await setAssetSegments(get, item);
    } else {
      const item = getItemById(connections, id);
      await setConnectionSegments(get, item);
    }

    onSelectedNode(id, type);
  };

  return [setSelectedNode];
};

export default useSelectNode;
