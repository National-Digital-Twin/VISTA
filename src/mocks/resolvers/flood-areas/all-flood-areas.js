const allFloodAreas = (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json([
      {
        uri: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065WAF212",
        name: "Eastern Yar",
        polygon_uri:
          "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065WAF212/polygon",
        flood_areas: [
          {
            uri: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065FWF7102",
            name: "Sandown, Brading and Bembridge on the Eastern Yar",
            polygon_uri:
              "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065FWF7102/polygon",
          },
          {
            uri: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065FWF7101",
            name: "Whitwell, Wroxall, Langbridge, Alverstone on the Eastern Yar",
            polygon_uri:
              "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/065FWF7101/polygon",
          },
        ],
      },
    ])
  );
};
export default allFloodAreas;
