export const mockAssessmentsResponse = (req, res, ctx) =>
  res(
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

export const mockEmptyRespose = (req, res, ctx) => res.once(ctx.status(200), ctx.json([]));

export const mockError = (req, res, ctx) =>
  res.once(ctx.status(400), ctx.json({ message: "an error has occured" }));
