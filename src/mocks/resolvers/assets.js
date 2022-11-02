import { ENERGY_ASSETS, MEDICAL_ASSETS } from "./../data"

const assets = (req, res, ctx) => {
  const assessments = req.url.searchParams.getAll("assessments");
  const assets = [];
  if (assessments.includes("http://telicent.io/fake_data#Energy_Assessment")) {
    assets.push(...ENERGY_ASSETS);
  }
  if (assessments.includes("http://telicent.io/fake_data#Medical_Assessment")) {
    assets.push(...MEDICAL_ASSETS);
  }
  return res(ctx.status(200), ctx.json(assets));
};

export default assets;
