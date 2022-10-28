import { createData } from "../utils";
import { E001, E001_E003, E003, E005, E005_E006, E006, E006_E012 } from "../../../sample-data";

const assets = [E001, E003, E005, E006];
const connections = [E001_E003, E006_E012, E005_E006];

test("creates data", async () => {
  const data = await createData(assets, connections);
  expect(data).toMatchSnapshot();
});
