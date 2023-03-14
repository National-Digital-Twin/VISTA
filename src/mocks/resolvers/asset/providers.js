const mockedProviders = [
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E001_E003_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    providerNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    providerName: "East Cowes 132/33kV Substation",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E001",
    dependentNodeType: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
    dependentName: "East Cowes Power Station",
    criticalityRating: 3,
    osmID: null,
  },
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E003_E025_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E025",
    providerNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    providerName: "Fawley 132 kV Substation - Hants",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    dependentNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    dependentName: "East Cowes 132/33kV Substation",
    criticalityRating: 3,
    osmID: null,
  },
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E003_E001_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E001",
    providerNodeType: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
    providerName: "East Cowes Power Station",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    dependentNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    dependentName: "East Cowes 132/33kV Substation",
    criticalityRating: 3,
    osmID: null,
  },
];

const providers = (req, res, ctx) => {
  const assetUri = req.url.searchParams.get("assetUri");
  const providers = mockedProviders.filter(
    (mockedProvider) => mockedProvider.dependentNode === assetUri
  );

  if (providers) return res(ctx.status(200), ctx.json(providers));
  return res(ctx.status(404), ctx.json({ detail: `Details for ${assetUri} not found` }));
};

export default providers;
