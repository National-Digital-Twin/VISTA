import ConnectionAssessment from "../models/ConnectionAssessment";
import Asset from "../models/Asset";

/**
 * filterConnectionByName
 * Iterates over the Connections and returns connections where the
 * source or target asset uri's match the name
 * @param {Array<ConnectionAssessment>} connections
 * @param {String} name
 * @returns {<Array<ConnectionAssessment>}
 */
const filterConnectionByName = (connections, name) =>
  connections.filter(
    (connection) =>
      connection.sourceAsset.uri === name || connection.targetAsset.uri === name
  );

/**
 * createConnection
 * @param {Array<ConnectionAssessmentApiResult>} connection
 * @param {Array<Asset>} assets
 * @returns {ConnectionAssessment} Instance of a ConnectionAssessment
 */
const createConnection = (connection, assets) =>
  new ConnectionAssessment({
    item: connection,
    source: assets[connection.asset1Uri],
    target: assets[connection.asset2Uri],
    criticality: connection.criticality,
  });

/**
 * processAssetConnections
 * Iterates over the result
 * @param {Array<ConnectionAssessmentApiResult>} result
 * @param {Array<Asset>} assets
 * @param {Number} startIndex
 * @returns {Array<ConnectionAssessment>} Array of ConnectionAssessment instances
 */
export const processAssetConnections = (result, assets, startIndex) => {
  const connections = result.slice(startIndex, result.length).flat();
  const connectionsWithAssets = connections.map((connection) =>
    createConnection(connection, assets)
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

/**
 *  Turn assets returned from the Api assessments endpoint
 *  to an Object of multipe Asset Instances
 * @param {AssetAssessmentApiResult} rawAssets
 * @param {Number} endIndex
 * @returns {AssetInstances} Object of Asset Instances
 */
export const processAssets = (rawAssets, endIndex) => {
  if (!rawAssets || rawAssets.length === 0) return;
  return rawAssets.slice(0, endIndex).flat().reduce(generateAssets, {});
};

// TODO: is this still used. Connection method?
const getConnectionAssetsCounts = (connection) => [
  connection.sourceAsset.getCount(),
  connection.targetAsset.getCount(),
];

// TODO: is this still used. Connection method?
const getConnectionAssetsScores = (connection) => [
  connection.sourceAsset.getCriticality(),
  connection.targetAsset.getCriticality(),
];

// TODO: is this still used. Connection method?
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

/**
 *
 * @param {*} assessmentsAllCategories
 * @param {Number} selectedLength
 * @returns
 */
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
