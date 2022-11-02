const mock400Error = (req, res, ctx) =>
  res.once(ctx.status(400), ctx.json({ message: "an error has occured" }));

export default mock400Error;