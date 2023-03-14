export const LOW_ENERGY_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX = [
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#E014",
    type: "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex",
    lat: 50.662086,
    lon: -1.1537488,
    dependentCount: 26,
    dependentCriticalitySum: 78,
    partCount: 0,
  },
];

export const HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS = [
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#E003",
    type: "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    lat: 50.745509,
    lon: -1.2862864,
    dependentCount: 4,
    dependentCriticalitySum: 12,
    partCount: 0,
  },
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#E025",
    type: "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
    lat: 50.817705,
    lon: -1.3292354,
    dependentCount: 3,
    dependentCriticalitySum: 8,
    partCount: 0,
  },
];

export const OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS = [
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#E001",
    type: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
    lat: 50.746912,
    lon: -1.2862509,
    dependentCount: 1,
    dependentCriticalitySum: 3,
    partCount: 0,
  },
];

export const HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES =
  [
    {
      dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E026_E025_dependency",
      providerNode: "https://www.iow.gov.uk/DigitalTwin#E025",
      providerNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      providerName: null,
      dependentNode: "https://www.iow.gov.uk/DigitalTwin#E026",
      dependentNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      dependentName: null,
      criticalityRating: 2,
      osmID: null,
    },
    {
      dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E001_E003_dependency",
      providerNode: "https://www.iow.gov.uk/DigitalTwin#E003",
      providerNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      providerName: null,
      dependentNode: "https://www.iow.gov.uk/DigitalTwin#E001",
      dependentNodeType: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
      dependentName: null,
      criticalityRating: 3,
      osmID: null,
    },
    {
      dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E003_E001_dependency",
      providerNode: "https://www.iow.gov.uk/DigitalTwin#E001",
      providerNodeType: "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex",
      providerName: null,
      dependentNode: "https://www.iow.gov.uk/DigitalTwin#E003",
      dependentNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      dependentName: null,
      criticalityRating: 3,
      osmID: null,
    },
    {
      dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E003_E025_dependency",
      providerNode: "https://www.iow.gov.uk/DigitalTwin#E025",
      providerNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      providerName: null,
      dependentNode: "https://www.iow.gov.uk/DigitalTwin#E003",
      dependentNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      dependentName: null,
      criticalityRating: 3,
      osmID: null,
    },
    {
      dependencyUri: "https://www.iow.gov.uk/DigitalTwin#_E004_E025_dependency",
      providerNode: "https://www.iow.gov.uk/DigitalTwin#E025",
      providerNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      providerName: null,
      dependentNode: "https://www.iow.gov.uk/DigitalTwin#E004",
      dependentNodeType:
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex",
      dependentName: null,
      criticalityRating: 3,
      osmID: null,
    },
  ];
