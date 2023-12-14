const mockedDependents = [
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
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E008_E003_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    providerNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    providerName: "East Cowes 132/33kV Substation",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E008",
    dependentNodeType:
      "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
    dependentName: "Shalfleet 33kV / 11kV Substation",
    criticalityRating: 3,
    osmID: null,
  },
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E002_E003_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    providerNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    providerName: "East Cowes 132/33kV Substation",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E002",
    dependentNodeType:
      "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
    dependentName: "East Cowes 33kv /11kV Substation",
    criticalityRating: 3,
    osmID: null,
  },
  {
    dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E012_E003_dependency",
    providerNode: "https://www.iow.gov.uk/DigitalTwin#E003",
    providerNodeType:
      "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    providerName: "East Cowes 132/33kV Substation",
    dependentNode: "https://www.iow.gov.uk/DigitalTwin#E012",
    dependentNodeType:
      "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
    dependentName: "Ventnor 33kV / 11kV Substation",
    criticalityRating: 3,
    osmID: null,
  },
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
];

const dependents = (req, res, ctx) => {
  const assetUri = req.url.searchParams.get("assetUri");

  const dependents = mockedDependents.filter((dependent) => dependent.providerNode === assetUri);
  if (dependents) return res(ctx.status(200), ctx.json(dependents));
  return res(ctx.status(404), ctx.json({ detail: `Details for ${assetUri} not found` }));
};

export default dependents;
