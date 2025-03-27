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
    passwordInput: "Password",
    loginBtn: "button[color='primary']",
    errorMessage: "alert",
  };

  async navigateToLoginPage(url: string) {
    await this.base.goto(url);
    await expect(this.page).toHaveTitle("Sign-in");
  }
  async enterUserName(user: string) {
    await expect(this.page.locator('[name="username"]')).toBeVisible();
    await this.page.locator('[name="username"]').fill(user);
  }
  async enterPassword(password: string) {
    await expect(this.page.locator('[name="password"]')).toBeVisible();
    await this.page.locator('[name="password"]').fill(password);
  }
  async clickSigninButton() {
    await expect(
      this.page.getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
    await this.page.getByRole("button", { name: "Sign in" }).click();
    await this.page.waitForTimeout(2000);
  }
  async loginUser(user: string, password: string) {
    await this.enterUserName(user);
    await this.enterPassword(password);
    await this.clickSigninButton();
  }
}
