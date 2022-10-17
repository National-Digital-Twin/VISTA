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
];
