import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class LayersPage {
  private base: PlaywrightWrapper;
  constructor(private page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  private Elements = {
    menuParalog: "Paralog",
    polygon:"svg path, .polygon-layer, canvas"
  };

  async verifyPolygonIsDrawn() {
    await this.page.waitForTimeout(3000);
    await this.page.getByRole("heading", { name: "Flood Polygons" }).click();
    const polygonExists = await this.page
      .locator(this.Elements.polygon)
      .count();
    expect(polygonExists).toEqual(40);
    const drawPolygonButton = this.page.locator(
      'button:has-text("Draw Polygon")',
    );
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
    const polygonAdded = await this.page
      .locator(this.Elements.polygon)
      .count();
    expect(polygonAdded).toEqual(44);
  }

  async zoomWithButtonWithScreenshotComparison() {
    const zoomInButton = this.page.locator('button[title="Zoom in"]');
    const zoomOutButton = this.page.locator('button[title="Zoom out"]');
    const beforeZoom = await this.page.screenshot();
    await zoomInButton.click();
    const afterZoomIn = await this.page.screenshot();
    expect(afterZoomIn).not.toEqual(beforeZoom);
    await zoomOutButton.click();
    const afterZoomOut = await this.page.screenshot();
    expect(afterZoomOut).not.toEqual(afterZoomIn);
  }

  async zoomOnTheMapWithScreenshotComparison() {
    await this.page.waitForTimeout(2000);
    await this.page.mouse.move(600, 400);
    const beforeZoom = await this.page.screenshot();
    await this.page.mouse.wheel(0, -500);
    await this.page.waitForTimeout(2000);
    const afterZoom = await this.page.screenshot();
    await this.page.mouse.wheel(0, 500);
    await this.page.waitForTimeout(2000);
    const afterZoomOut = await this.page.screenshot();
    expect(afterZoomOut).not.toEqual(afterZoom);
  }
}
