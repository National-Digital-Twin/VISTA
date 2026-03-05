// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { basePage } from '../../hooks/basePage';
import LayersPage from '../../pages/layersPage';

let layersPage: LayersPage;
setDefaultTimeout(60 * 1000 * 2);

When('I click on transport infrastructure for road and Bridges', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.clickTransportInfrastructure();
});

Then('I can turn on asset accordion', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.assetsWithinAccordionIsVisible();
});
