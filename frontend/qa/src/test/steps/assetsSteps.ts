import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";
let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When("I click on transport infrastructure", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.clickTransportInfrastructure()
});
