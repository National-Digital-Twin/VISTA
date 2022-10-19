import { rest } from "msw";
import config from "../config/app-config";

export const handlers = [
  rest.get(`${config.api.url}/assessments`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          uri: "http://telicent.io/fake_data#Energy_Assessment",
          name: "Energy",
          assCount: "25",
        },
        {
          uri: "http://telicent.io/fake_data#Transport_Assessment",
          name: "Transport",
          assCount: "44",
        },
      ])
    );
  }),
  rest.get(`${config.api.url}/assessments/assets`, (req, res, ctx) => {
    const assessments = req.url.searchParams.get("assessments");
    if (assessments === "http://telicent.io/fake_data#Energy_Assessment") {
      console.log("here");
      return res(
        ctx.status(200),
        ctx.json([
          {
            uri: "http://telicent.io/fake_data#E001",
            id: "E001",
            name: "East Cowes Power Station",
            type: "http://ies.data.gov.uk/ontology/ies4#Facility",
            lat: "50.7469147487978",
            lon: "-1.286223030930041",
            desc: "Cowes power station (or Kingston power station) is a 140MW Open Cycle Gas Turbine station powered by two 70MW units. The station is the Isle of Wight's only conventional power generation source other than power from the mainland. The station was built in 1982 at a cost of �30 million. The station is owned and operated by RWE Generation UK.",
          },
          {
            uri: "http://telicent.io/fake_data#E003",
            id: "E003",
            name: "East Cowes 132/33kV Substation",
            type: "http://ies.data.gov.uk/ontology/ies4#Facility",
            lat: "50.745512094115526",
            lon: "-1.2862585277780134",
          },
          {
            uri: "http://telicent.io/fake_data#E005",
            id: "E005",
            name: "Arreton Power Source",
            type: "http://ies.data.gov.uk/ontology/ies4#Facility",
            lat: "50.67506215068563",
            lon: "-1.2532016776565253",
            desc: "Gore Cross Anerobic Digestion Plant 2.2MW biogas plant run by Wight Farm Energy",
          },
          {
            uri: "http://telicent.io/fake_data#E006",
            id: "E006",
            name: "Arreton 33kV ",
            type: "http://ies.data.gov.uk/ontology/ies4#Facility",
            lat: "50.67381026264697",
            lon: "-1.2376239838760517",
            desc: "Not labelled as a substation on openstreetmap. Visible on Google maps though.",
          },
        ])
      );
    }
    return res(ctx.status(200), ctx.json([]));
  }),
  rest.get(`${config.api.url}/assessments/connections`, (req, res, ctx) => {
    const assessments = req.url.searchParams.get("assessments");
    if (assessments === "http://telicent.io/fake_data#Energy_Assessment") {
      return res(
        ctx.status(200),
        ctx.json([
          {
            connUri: "http://telicent.io/fake_data#connector_E001_E003",
            asset1Uri: "http://telicent.io/fake_data#E001",
            asset2Uri: "http://telicent.io/fake_data#E003",
            criticality: "3.0",
          },
          {
            connUri: "http://telicent.io/fake_data#connector_E006_E012",
            asset1Uri: "http://telicent.io/fake_data#E006",
            asset2Uri: "http://telicent.io/fake_data#E012",
            criticality: "3.0",
          },
          {
            connUri: "http://telicent.io/fake_data#connector_E005_E006",
            asset1Uri: "http://telicent.io/fake_data#E005",
            asset2Uri: "http://telicent.io/fake_data#E006",
            criticality: "3.0",
          },
        ])
      );
    }
    return res(ctx.status(200), ctx.json([]));
  }),
];
