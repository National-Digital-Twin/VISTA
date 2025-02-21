import { Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

Then(
  "I should be able to zoom in and out on the map using zoom button",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomWithButtonWithScreenshotComparison();
  },
);

Then("I should be able to zoom in and out on the map", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.zoomOnTheMapWithScreenshotComparison();
});
