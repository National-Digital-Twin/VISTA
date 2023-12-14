const floodAreaPolygons = (req, res, ctx) => {
  const polygonUri = req.url.searchParams.getAll("polygon_uri");
  let featureCollection = undefined;

  if (
    polygonUri.includes(
      "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065WAF212/polygon"
    )
  ) {
    featureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: [["flood area 1"], ["flood area 2"]],
          },
          properties: {
            AREA: "Solent and South Downs",
            FWS_TACODE: "065WAF212",
            TA_NAME: "Eastern Yar",
            DESCRIP: "Eastern Yar and tributaries from Whitwell to Bembridge",
            LA_NAME: "Isle of Wight",
            QDIAL: "216075",
            RIVER_SEA: "Eastern Yar",
          },
        },
      ],
      crs: null,
    };
  }

  if (featureCollection) return res(ctx.status(200), ctx.json(featureCollection));
  return res(ctx.status(404), ctx.json({ detail: `Polygon ${polygonUri} is not found` }));
};
export default floodAreaPolygons;
