export const E001_E003 = {
  connUri: "http://telicent.io/fake_data#connector_E001_E003",
  asset1Uri: "http://telicent.io/fake_data#E001",
  asset2Uri: "http://telicent.io/fake_data#E003",
  criticality: "3.0",
};

export const E006_E012 = {
  connUri: "http://telicent.io/fake_data#connector_E006_E012",
  asset1Uri: "http://telicent.io/fake_data#E006",
  asset2Uri: "http://telicent.io/fake_data#E012",
  criticality: "3.0",
};

export const E005_E006 = {
  connUri: "http://telicent.io/fake_data#connector_E005_E006",
  asset1Uri: "http://telicent.io/fake_data#E005",
  asset2Uri: "http://telicent.io/fake_data#E006",
  criticality: "3.0",
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
