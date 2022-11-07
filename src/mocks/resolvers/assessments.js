import { DATASET } from "../data";

const assessments = (req, res, ctx) => res(ctx.status(200), ctx.json(DATASET));
export default assessments;