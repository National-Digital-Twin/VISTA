export const E001_DETAILS = {
  uri: "http://telicent.io/fake_data#E001",
  title: "East Cowes Power Station (E001)",
  criticality: 3,
  type: "http://ies.data.gov.uk/ontology/ies4#Facility",
  description:
    "Cowes power station (or Kingston power station) is a 140MW Open Cycle Gas Turbine station powered by two 70MW units. The station is the Isle of Wight's only conventional power generation source other than power from the mainland. The station was built in 1982 at a cost of �30 million. The station is owned and operated by RWE Generation UK.",
  lat: 50.7469147487978,
  lng: -1.286223030930041,
  color: "#56be2d",
  connectedAssets: [
    {
      uri: "http://telicent.io/fake_data#E003",
      title: "East Cowes 132/33kV Substation (E003)",
      assetCriticality: 3,
      cxnCriticality: 3,
      color: "#56be2d",
    },
  ],
  elementType: "asset",
};

export const E003_DETAILS = {
  uri: "http://telicent.io/fake_data#E003",
  title: "East Cowes 132/33kV Substation (E003)",
  criticality: 3,
  type: "http://ies.data.gov.uk/ontology/ies4#Facility",
  description: null,
  lat: 50.745512094115526,
  lng: -1.2862585277780134,
  color: "#56be2d",
  connectedAssets: [
    {
      uri: "http://telicent.io/fake_data#E001",
      title: "East Cowes Power Station (E001)",
      assetCriticality: 3,
      cxnCriticality: 3,
      color: "#56be2d",
    },
  ],
  elementType: "asset",
};

export const E001_E003_DETAILS = {
  uri: "http://telicent.io/fake_data#connector_E001_E003",
  title: "East Cowes Power Station (E001) to East Cowes 132/33kV Substation (E003)",
  criticality: 3,
  color: "#fb3737",
  connectedAssets: [
    {
      uri: "http://telicent.io/fake_data#E001",
      title: "East Cowes Power Station (E001)",
      assetCriticality: 3,
      cxnCriticality: 3,
      color: "#56be2d",
    },
    {
      uri: "http://telicent.io/fake_data#E003",
      title: "East Cowes 132/33kV Substation (E003)",
      assetCriticality: 3,
      cxnCriticality: 3,
      color: "#56be2d",
    },
  ],
  elementType: "connection",
};