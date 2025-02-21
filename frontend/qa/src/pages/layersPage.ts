import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class LayersPage {
  private base: PlaywrightWrapper;
  constructor(private page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  private Elements = {
    menuParalog: "Paralog",
  };

  async verifyPolygonIsDrawn() {
    await this.page.waitForTimeout(3000);
    await this.page.getByRole('heading', { name: 'Flood Polygons' }).click();
    const polygonExists = await this.page.locator('svg path, .polygon-layer, canvas').count();
    console.log('polygon' + polygonExists);
    expect(polygonExists).toEqual(40);
    const drawPolygonButton = this.page.locator('button:has-text("Draw Polygon")');
    await drawPolygonButton.click();

    await this.page.mouse.move(500, 300);
    await this.page.mouse.down();

    await this.page.mouse.move(600, 300);
    await this.page.mouse.click(600, 300);

    await this.page.mouse.move(600, 400);
    await this.page.mouse.click(600, 400);

    await this.page.mouse.move(500, 400);
    await this.page.mouse.click(500, 400);
    await this.page.mouse.move(500, 300);
    await this.page.mouse.click(500, 300);

    await this.page.mouse.up();
    await this.page.waitForTimeout(3000);
    const polygonAdded = await this.page.locator('svg path, .polygon-layer, canvas').count();
    console.log('polygon' + polygonAdded);
    expect(polygonAdded).toEqual(44);
  }
}
