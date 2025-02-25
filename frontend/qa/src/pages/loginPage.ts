import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class LoginPage {
  private base: PlaywrightWrapper;
  constructor(private page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  //Object Locators
  private Elements = {
    userInput: "username",
    passwordInput: "Password",   // pragma: allowlist secret
    loginBtn: "button[color='primary']",
    errorMessage: "alert",
  };

  async navigateToLoginPage(url: string) {
    await this.base.goto(url);
    await expect(this.page).toHaveTitle("Sign-in");
  }
  async enterUserName(user: string) {
    await this.page.locator('[name="username"]').fill(user); // pragma: allowlist secret
    await this.page.getByRole("button", { name: "Next" }).click();
}

async enterPassword(password: string) {
    await expect(this.page).toHaveTitle("Enter your password");
    await this.page.locator('[name="password"]').fill(password); // pragma: allowlist secret
}

  async clickLoginButton() {
    await this.page.getByRole("button", { name: "Continue" }).click();
  }

  async loginUser(user: string, password: string) {
    await this.enterUserName(user);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }
  async verifyAssetDetailsTabIsDisplayed() {
    await expect(
      this.page.getByRole("tab", { name: "Asset details" }),
    ).toBeVisible();
  }

  async verifyLayersTabIsDisplayed() {
    await expect(this.page.getByRole("tab", { name: "Layers" })).toBeVisible();
  }
}
