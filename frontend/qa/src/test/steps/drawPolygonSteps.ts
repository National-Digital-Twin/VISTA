import { When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { basePage } from '../../hooks/basePage';
import LayersPage from '../../pages/layersPage';

let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

When('I draw a polygon', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.drawAPolygon();
});

Then('I should be able to verify a polygon is drawn successfully', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.verifyPolygonIsDrawn();
});
