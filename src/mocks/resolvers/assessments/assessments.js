import { ASSESSMENTS } from "mocks/data";

const assessments = (req, res, ctx) => res(ctx.status(200), ctx.json(ASSESSMENTS));
export default assessments;