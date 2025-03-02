import { When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When(
  "I draw a vulnerable people area and click a vulnerable person",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.drawAndClickVulnerableArea();
  },
);

Then(
  "I can see the details of the vulnerable person displayed",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.verifyVulnerabilityDetailIsDisplayed();
  },
);
