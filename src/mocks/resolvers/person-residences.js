import { isEmpty } from "lodash";

export const V013_RESIDENCES = [
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#R013",
    assetType: "http://ies.data.gov.uk/ontology/ies4#ResidentialBuilding",
    name: null,
    lat: 50.681189,
    lon: -1.5148608,
    address: "12 Afton Rd, Freshwater , PO40 9UH",
    desc: null,
    osmID: null,
    wikipediaPage: null,
    webPage: null,
    dependentCount: null,
    dependentCriticalitySum: null,
  },
];

const personResidences = (req, res, ctx) => {
  const personUri = req.url.searchParams.get("personUri");
  let residences = [];

  if (personUri === "https://www.iow.gov.uk/DigitalTwin%23V013") {
    residences = V013_RESIDENCES;
  }
  if (isEmpty(residences)) {
    return res(ctx.status(404), ctx.json(`Residences for ${personUri} not found`));
  }
  return res(ctx.status(200), ctx.json(residences));
};
export default personResidences;
