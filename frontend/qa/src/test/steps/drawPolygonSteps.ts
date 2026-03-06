// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
