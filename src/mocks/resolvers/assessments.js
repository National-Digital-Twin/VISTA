import { DATASET } from "../data";

const assessments = (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json(DATASET)
  );
}

export default assessments;