const SUPER_CLASSES = {
  "http://ies.data.gov.uk/ontology/ies4#WastewaterCollectionNetwork": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#WastewaterComplex"],
  },
  "http://ies.data.gov.uk/ontology/ies4#WaterExtractionComplex": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#Facility"],
  },
  "http://ies.data.gov.uk/ontology/ies4#Road": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#Facility"],
  },
  "http://ies.data.gov.uk/ontology/ies4#TelecommunicationsComplex": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#Facility"],
  },
  "http://ies.data.gov.uk/ontology/ies4#WaterDistributionComplex": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#Facility"],
  },
  "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#ElectricalPowerDistributionComplex"],
  },
  "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex": {
    superClass: ["http://ies.data.gov.uk/ontology/ies4#ElectricalPowerDistributionComplex"],
  },
};

const ontologyClass = (req, res, ctx) => {
  const classUri = req.url.searchParams.get("classUri");
  return res(ctx.status(200), ctx.json({ [classUri]: SUPER_CLASSES[classUri] }));
};

export default ontologyClass;
