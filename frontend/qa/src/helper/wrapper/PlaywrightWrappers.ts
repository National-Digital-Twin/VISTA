import { Locator, Page } from "@playwright/test";

export default class PlaywrightWrapper {
  constructor(private page: Page) {}

  async goto(url: string) {
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  }

  async waitAndClick(locator: Locator) {
    await locator.waitFor({
      state: "visible",
    });
    await locator.click();
  }

  async navigateTo(link: string) {
    await Promise.all([this.page.waitForNavigation(), this.page.click(link)]);
  }

  async moveAndClick(x: number, y: number) {
    await this.page.mouse.move(x, y);
    await this.page.mouse.click(x, y);
  }
}
