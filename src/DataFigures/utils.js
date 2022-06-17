import ConnectionAssessment from "./ConnectionAssessment";
import Asset from "./Asset";

const filterConnectionByName = (connections, name) =>
  connections.filter(
    (connection) =>
      connection.sourceAsset.uri === name || connection.targetAsset.uri === name
  );

export const processAssetConnections = (result, assets, startIndex) => {
  const connections = result.slice(startIndex, result.length).flat();

  const connectionsWithAssets = connections.map(
    (connection) =>
      new ConnectionAssessment({
        item: connection,
        source: assets[connection.asset1Uri],
        target: assets[connection.asset2Uri],
        criticality: connection.criticality,
      })
  );

  for (let name in assets) {
    assets[name].processConnections(
      filterConnectionByName(connectionsWithAssets, name),
      assets
    );
  }

  return connectionsWithAssets;
};

const generateAssets = (acc, curr, idx) => {
  const uri = curr.uri;
  if (!acc[uri]) {
    acc[uri] = new Asset({ item: curr, idx });
  }
  acc[uri].setDescription(curr.desc);
  acc[uri].setLatitude(curr.lat);
  acc[uri].setLongitude(curr.lon);

  return acc;
};

export const processAssets = (rawAssets, endIndex) => {
  if (!rawAssets || rawAssets.length === 0) {
    return undefined;
  }

  return rawAssets.slice(0, endIndex).flat().reduce(generateAssets, {});
};

const getConnectionAssetsCounts = (connection) => [
  connection.sourceAsset.getCount(),
  connection.targetAsset.getCount(),
];

const getConnectionAssetsScores = (connection) => [
  connection.sourceAsset.getCriticality(),
  connection.targetAsset.getCriticality(),
];

const calcScoreAndCountColour = (count, score) => (item) => {
  item.calculateScoreColour(score);
  item.calculateCountColour(count);
};

const setColourByScore = (score) => (connection) => {
  connection.setColour(score);
};

const getMaxCountAndScore = (connections) => {
  const counts = connections.map(getConnectionAssetsCounts).flat();
  const scores = connections.map(getConnectionAssetsScores).flat();
  const maxCount = Math.max(...counts);
  const maxScore = Math.max(...scores);

  return { maxCount, maxScore };
};

export const buildAssetAndConnectionLinks = (
  assessmentsAllCategories,
  selectedLength
) => {
  const processedAssets = processAssets(
    assessmentsAllCategories,
    selectedLength
  );

  const connections = processAssetConnections(
    assessmentsAllCategories,
    processedAssets,
    selectedLength
  );

  const { maxCount, maxScore } = getMaxCountAndScore(connections);
  const calcMaxScoreAndCountColour = calcScoreAndCountColour(
    maxCount,
    maxScore
  );
  const setColourByMaxScore = setColourByScore(maxScore);

  Object.values(processedAssets).forEach(calcMaxScoreAndCountColour);
  Object.values(connections).forEach(setColourByMaxScore);

  return {
    connections: Object.values(connections),
    assets: Object.values(processedAssets),
  };
};
