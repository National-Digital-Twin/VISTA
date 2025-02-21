import { Then, setDefaultTimeout } from "@cucumber/cucumber";
import { basePage } from "../../hooks/basePage";
import LayersPage from "../../pages/layersPage";

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

Then("I should be able to draw a polygon successfully", async function () {
  layersPage = new LayersPage(basePage.page);
  await layersPage.verifyPolygonIsDrawn();
});
