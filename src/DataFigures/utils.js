import * as R from "ramda";
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

export const generateConnectionAssessments = (result, assets, startIndex) =>
  R.pipe(
    R.slice(startIndex, result.length),
    R.flatten,
    R.reduce(processConnectionAssessments, {
      processedAssets: assets,
      maxCount: 1,
      maxScore: 1,
      reports: {},
    })
  )(result);

export const isEmptyArray = R.propSatisfies(R.equals(0), "length");

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

const reduceIndexed = R.addIndex(R.reduce);

export const processAssets = (rawAssets, endIndex) =>
  R.pipe(
    R.slice(0, endIndex),
    R.flatten,
    reduceIndexed(generateAssets, {})
  )(rawAssets);
