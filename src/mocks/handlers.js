import { rest } from "msw";

export const handlers = [
  rest.get('/assessments', (req, res, ctx) => {
    console.log("DEFAULT")
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
