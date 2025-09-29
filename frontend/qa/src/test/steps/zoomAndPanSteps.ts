import { When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { basePage } from '../../hooks/basePage';
import LayersPage from '../../pages/layersPage';

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When('I zoom in and out using the zoom button', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomInWithButton();
    await layersPage.zoomOutWithButton();
});

Then('I am zoomed in and out', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomWithButtonWithScreenshotComparison();
});

When('I zoom in and out on the map using the mouse wheel', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomOnTheMap();
    await layersPage.zoomOutTheMap();
});

Then('I should be able to zoom in and out', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.zoomOnTheMapWithScreenshotComparison();
});

When('I am on the map', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.panAroundTheMap();
});

Then('I should be able to pan around the map', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.panWithScreenshotComparison();
});
