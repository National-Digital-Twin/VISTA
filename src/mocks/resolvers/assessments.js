export const mockEmptyRespose = (req, res, ctx) => {
  console.log("RETURN []");
  return res.once(ctx.status(200), ctx.json([]));
};

export const mockError = (req, res, ctx) =>
  res.once(ctx.status(400), ctx.json({ message: "an error has occured" }));
