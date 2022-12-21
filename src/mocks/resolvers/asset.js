const asset = (req, res, ctx) => {
  const assetUri = req.url.searchParams.get("assetUri");
  let asset = {};

  if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E014") {
    asset = {
      uri: "https://www.iow.gov.uk/DigitalTwin#E014",
      assetType: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
      name: "Sandown 33kV / 11kV Substation",
      lat: 50.662086,
      lon: -1.1537488,
      address: null,
      desc: null,
      osmID: null,
      wikipediaPage: null,
      webPage: null,
      dependentCount: 26,
      dependentCriticalitySum: 78,
    };
  }
  if (assetUri === "https://www.iow.gov.uk/DigitalTwin#E012") {
    asset = {
      uri: "https://www.iow.gov.uk/DigitalTwin#E012",
      assetType: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
      name: "Ventnor 33kV / 11kV Substation",
      lat: 50.597512,
      lon: -1.208188,
      address: null,
      desc: null,
      osmID: null,
      wikipediaPage: null,
      webPage: null,
      dependentCount: 28,
      dependentCriticalitySum: 84,
    };
  }
  return res(ctx.status(200), ctx.json(asset));
};

export default asset;
