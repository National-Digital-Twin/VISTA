// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { basePage } from '../../hooks/basePage';
import LoginPage from '../../pages/loginPage';
import LandingPage from '../../pages/landingPage';
import LayersPage from '../../pages/layersPage';

let loginPage: LoginPage;
let landingPage: LandingPage;
let layersPage: LayersPage;

setDefaultTimeout(60 * 1000 * 2);

Given('I login to the ndtp app with the user credentials', async function () {
    loginPage = new LoginPage(basePage.page);
    await loginPage.navigateToLoginPage(process.env.BASEURL);
    basePage.logger.info('Navigated to the application');
    await loginPage.loginUser(process.env.TESTUSER, process.env.TESTPASS);
});

When('I click the Vista menu', async function () {
    landingPage = new LandingPage(basePage.page);
    await landingPage.clickMenuByName();
});

Then('I should see the asset details and layers tab', async function () {
    layersPage = new LayersPage(basePage.page);
    await layersPage.verifyAssetDetailsTabIsDisplayed();
    await layersPage.verifyLayersTabIsDisplayed();
});
