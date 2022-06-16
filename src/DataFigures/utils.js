import ConnectionAssessment from "./ConnectionAssessment";
import Asset from "./Asset";

const processConnectionAssessments = (acc, curr) => {
  const criticality = parseInt(curr.criticality);
  const asset1 = acc.processedAssets[curr.asset1Uri];
  const asset2 = acc.processedAssets[curr.asset2Uri];
  asset1.incrementCount();
  asset2.incrementCount();
  asset1.incrementCriticalityBy(criticality);
  asset2.incrementCriticalityBy(criticality);

  if (asset1.isCountGreaterThan(acc.maxCount)) {
    acc.maxCount = asset1.getCount();
  }

  if (asset2.isCountGreaterThan(acc.maxCount)) {
    acc.maxCount = asset2.getCount();
  }

  if (asset1.isCriticalityGreaterThan(acc.maxScore)) {
    acc.maxScore = asset1.getCriticality();
  }

  if (asset2.isCriticalityGreaterThan(acc.maxScore)) {
    acc.maxScore = asset2.getCriticality();
  }

  const connectionAssessment = new ConnectionAssessment(
    curr,
    asset1,
    asset2,
    criticality
  );

  acc.reports[curr.connUri] = connectionAssessment;

  return acc;
};

const filterConnectionByName = (connections, name) =>
  connections.filter(
    (connection) =>
      connection.asset1Uri === name || connection.asset2Uri === name
  );

export const processAssetConnections = (result, assets, startIndex) => {
  const connections = result.slice(startIndex, result.length).flat();

  for (let name in assets) {
    assets[name].processConnections(
      filterConnectionByName(connections, name),
      assets
    );
  }

  return connections.map(
    (connection) =>
      new ConnectionAssessment(
        connection,
        assets[connection.asset1Uri],
        assets[connection.asset2Uri],
        connection.criticality
      )
  );
};
export const oldgenerateConnectionAssessments = (
  result,
  assets,
  startIndex
) => {
  console.log(result);
  return result
    .slice(startIndex, result.length)
    .flat()
    .reduce(processConnectionAssessments, {
      processedAssets: assets,
      maxCount: 1,
      maxScore: 1,
      reports: {},
    });
};

const generateAssets = (acc, curr, idx) => {
  const uri = curr.uri;
  if (!acc[uri]) {
    acc[uri] = new Asset(curr, idx);
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
