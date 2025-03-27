import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class LayersPage {
  private base: PlaywrightWrapper;
  constructor(private page: Page) {
    this.base = new PlaywrightWrapper(page);
  }

  private Elements = {
    menuParalog: "Paralog",
    polygon: "svg path, .polygon-layer, canvas",
  };

  async verifyPolygonIsDrawn() {
    const polygonAdded = await this.page.locator(this.Elements.polygon).count();
    expect(polygonAdded).toEqual(45);
  }

  async drawAPolygon() {
    await this.page.waitForTimeout(3000);
    const polygonHeading = this.page.getByText("Flood Polygons");
    await polygonHeading.waitFor({ state: "attached" });
    await polygonHeading.scrollIntoViewIfNeeded();
    await polygonHeading.waitFor({ state: "visible" });
    await polygonHeading.click();
    const polygonExists = await this.page
      .locator(this.Elements.polygon)
      .count();
    expect(polygonExists).toEqual(36);
    const drawPolygonButton = this.page.getByRole("button", {
      name: "Draw Polygon",
    });
    await drawPolygonButton.click();
    await this.page.mouse.move(500, 300);
    await this.page.mouse.down();
    await this.base.moveAndClick(600, 300);
    await this.base.moveAndClick(600, 400);
    await this.base.moveAndClick(500, 400);
    await this.base.moveAndClick(500, 300);
    await this.page.mouse.up();
    await this.page.waitForTimeout(3000);
  }

  async zoomWithButtonWithScreenshotComparison() {
    const beforeZoom = await this.page.screenshot();
    this.zoomInWithButton();
    const afterZoomIn = await this.page.screenshot();
    expect(afterZoomIn).not.toEqual(beforeZoom);
    this.zoomOutWithButton();
    const afterZoomOut = await this.page.screenshot();
    expect(afterZoomOut).not.toEqual(afterZoomIn);
  }

  async zoomInWithButton() {
    const zoomInButton = this.page.getByRole('button', { name: 'Zoom in' });
    await zoomInButton.click();
  }

  async zoomOutWithButton() {
    const zoomOutButton = this.page.getByRole('button', { name: 'Zoom out' });
    await zoomOutButton.click();
  }

  async zoomOnTheMapWithScreenshotComparison() {
    const beforeZoom = await this.page.screenshot();
    await this.page.waitForTimeout(2000);
    this.zoomOnTheMap();
    await this.page.waitForTimeout(2000);
    const afterZoom = await this.page.screenshot();
    expect(afterZoom).not.toEqual(beforeZoom);
    this.zoomOutTheMap();
    await this.page.waitForTimeout(2000);
    const afterZoomOut = await this.page.screenshot();
    expect(afterZoomOut).not.toEqual(afterZoom);
  }

  async zoomOnTheMap() {
    await this.page.mouse.move(600, 400);
    await this.page.mouse.wheel(0, -500);
  }

  async zoomOutTheMap() {
    await this.page.mouse.wheel(0, 500);
  }
  async drawAndClickVulnerableArea() {
    await this.page.waitForTimeout(3000);
    await this.page.getByRole("heading", { name: "Vulnerable People" }).click();
    const drawPolygonButton = this.page.locator('button:has-text("Draw Area")');
    await drawPolygonButton.click();
    await this.page.waitForTimeout(2000);
    await this.page.mouse.click(850, 300);
    await this.page.mouse.click(900, 250);
    await this.page.mouse.click(950, 200);
    await this.page.mouse.click(850, 300);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(5000);
    await this.page.mouse.click(900, 245);
    await this.page.waitForSelector("div._idCardItem_1nzqt_20");
  }
  async verifyVulnerabilityDetailIsDisplayed() {
    const detailsElements = await this.page
      .locator("div._idCardItem_1nzqt_20")
      .allTextContents();
    expect(detailsElements).toEqual([
      "Name: Philip Romeo",
      "Year of Birth: 1954",
      "UPRN: 10090466223.0",
      "Primary Support Reason: nan",
      "Disability: No conditions",
      "Coordinates: 50.71163324269709, -1.251859667094288",
      "Alert Category: nan",
      "Alert Detail: nan",
    ]);
  }

  async panWithScreenshotComparison() {
    const beforePan = await this.page.screenshot();
    await this.panAroundTheMap();
    const afterPan = await this.page.screenshot();
    expect(beforePan).not.toEqual(afterPan);
  }
  async panAroundTheMap() {
    await this.page.mouse.move(800, 400);
    await this.page.mouse.down();
    await this.page.mouse.move(1000, 400, { steps: 20 });
    await this.page.mouse.up();
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
