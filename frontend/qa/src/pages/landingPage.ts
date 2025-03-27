import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class LandingPage {
  private readonly base: PlaywrightWrapper;
  constructor(private readonly page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  //Object Locators
  private readonly Elements = {
    menuParalog: "Paralog",
  };

  async verifyDemoLandingPage() {
    await expect(this.page).toHaveTitle(".:Demo Landing Page:.");
  }

  async clickMenuByName() {
    const paralogBtn = await this.page.getByRole("link", {
      name: this.Elements.menuParalog,
    });
    await this.base.waitAndClick(paralogBtn);
    await this.page.waitForTimeout(3000);
  }
}
