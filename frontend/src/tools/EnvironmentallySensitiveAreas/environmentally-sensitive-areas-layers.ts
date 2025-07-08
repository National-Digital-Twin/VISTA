export const layers = {
  aonb: {
    name: "AoNB",
    layerFile: () => import("@/data/aonb-esa.json"),
  },
  countryParks: {
    name: "Country Parks",
    layerFile: () => import("@/data/country-parks-esa.json"),
  },
  environmentalStewardshipSchemaAreas: {
    name: "Environmental Stewardship Schema Areas",
    layerFile: () =>
      import("@/data/environmental-stewardship-schema-areas-esa.json"),
  },
};

export type EnvironmentallySensitiveAreasLayerId = keyof typeof layers;
