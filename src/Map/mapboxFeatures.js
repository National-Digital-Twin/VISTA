export const buildLineFeature = (asset) => ({
  type: "Feature",
  properties: {
    name: asset.uri,
    color: asset.getScoreColour(),
  },
  geometry: {
    type: "LineString",
    coordinates: asset.getCoordinates(),
  },
});

export const buildCircleFeature = (asset) => ({
  type: "Feature",
  properties: {
    name: asset.uri,
    color: asset.getScoreColour(),
    size: asset.getSize(),
  },
  geometry: {
    type: "Point",
    coordinates: asset.getCoordinates().flat(),
  },
});

export const buildLineFeatures = (assets) => assets.map(buildLineFeature);
export const buildCircleFeatures = (assets) => assets.map(buildCircleFeature);
