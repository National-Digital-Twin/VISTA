import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";

import { expect } from "@playwright/test";
import { basePage } from "../../hooks/basePage";
import AuthenticationPage from "../../pages/authenticationPage";

let authPage: AuthenticationPage;

setDefaultTimeout(60 * 1000 * 2)

When('I enter the auth key and click login button', async function () {
    authPage = new AuthenticationPage(basePage.page);
    await authPage.EnterKeyAndClickLoginBtn();
})

Then('I should see the asset detail tab', async function () {
  authPage = new AuthenticationPage(basePage.page);
  await authPage.verifyAssetDetailTabIsDisplayed();
})
