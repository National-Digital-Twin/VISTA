import { When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When(
  "I draw a vunerable people area and click a vunerable person",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.drawAndClickVunerableArea();
  },
);

Then("The details of the vunerable person is displayed", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.verifyVulnerabilityDetailIsDisplayed();
});
