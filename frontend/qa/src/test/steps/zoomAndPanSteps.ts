import { When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When("I zoom in and out using the zoom button", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.zoomInWithButton();
  await layersPage.zoomOutWithButton();
});

Then(
  "I should be able to compare zoom in and out screenshots",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomWithButtonWithScreenshotComparison();
  },
);

When("I zoom in and out on the map", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.zoomOnTheMap();
  await layersPage.zoomOutTheMap();
});

Then("I should be able to see the zoom difference in the screenshots", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.zoomOnTheMapWithScreenshotComparison();
});

When("I pan around the map", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.panAroundTheMap();
});

Then(
  "I should be able to compare the screenshots before and after panning",
  async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.panWithScreenshotComparison();
  },
);
