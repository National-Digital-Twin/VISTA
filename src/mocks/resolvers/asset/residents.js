import { isEmpty } from "lodash";

export const R013_RESIDENTS = [
  {
    uri: "https://www.iow.gov.uk/DigitalTwin#V013",
    name: "Mrs Martha Mainwaring",
  },
];

const residents = (req, res, ctx) => {
  const assetUri = req.url.searchParams.get("assetUri");
  let residents = [];

  if (assetUri === "https://www.iow.gov.uk/DigitalTwin#R013") {
    residents = R013_RESIDENTS;
  }
  if (isEmpty(residents)) {
    return res(ctx.status(404), ctx.json(`Resident information for ${assetUri} not found`));
  }
  return res(ctx.status(200), ctx.json(residents));
};
export default residents;
