const mockEmptyResponse = (req, res, ctx) => res.once(ctx.status(200), ctx.json([]));
export default mockEmptyResponse;