import { createData } from "../dataset-utils";
import { ENERGY_ASSETS, ENERGY_CONNECTIONS } from "mocks";

test("creates data", async () => {
  const data = await createData(ENERGY_ASSETS, ENERGY_CONNECTIONS);
  expect(data).toMatchSnapshot();
});
