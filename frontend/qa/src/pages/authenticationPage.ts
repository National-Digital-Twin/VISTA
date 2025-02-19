import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";
import * as dotenv from 'dotenv';
dotenv.config();

export default class AuthenticationPage {
    private base: PlaywrightWrapper
    constructor(private page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    private Elements = {
        authField: "XXXX-XXXX-XXXX-XXXX",
    }

    async EnterKeyAndClickLoginBtn() {
      const key = process.env.AUTH_KEY;
      await this.page.getByPlaceholder(this.Elements.authField).click();
      await this.page.getByPlaceholder(this.Elements.authField).fill(key);
      await this.page.getByRole('button', { name: 'Log In' }).click();
    }

    async verifyAssetDetailTabIsDisplayed() {
      await expect(this.page.getByRole('tab', { name: 'Asset details' })).toBeVisible();
  }
  }
