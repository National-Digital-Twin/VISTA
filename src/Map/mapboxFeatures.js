export const buildLineFeature = (asset) => {
  const coords =
    asset.category === "connection" && asset.getCoordinates().length > 2
      ? asset.getCoordinates()[0]
      : asset.getCoordinates();

  return {
    type: "Feature",
    properties: {
      name: asset.uri,
      color: asset.getScoreColour(),
    },
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };
};

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
