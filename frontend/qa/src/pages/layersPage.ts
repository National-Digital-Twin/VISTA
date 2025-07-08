import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";
import { Console } from "winston/lib/winston/transports";

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
    expect(polygonAdded).toBeGreaterThan(1);
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
    const zoomInButton = this.page.getByRole("button", { name: "Zoom in" });
    await zoomInButton.click({ force: true });
  }

  async zoomOutWithButton() {
    const zoomOutButton = this.page.getByRole("button", { name: "Zoom out" });
    await zoomOutButton.click({ force: true });
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
    const vulnerablePeopleText= this.page.getByText('Vulnerable People', { exact: true });
    await vulnerablePeopleText.waitFor({ state: "attached" });
    await vulnerablePeopleText.scrollIntoViewIfNeeded();
    vulnerablePeopleText.click();
    const drawPolygonButton = this.page.getByRole('button', { name: 'Draw Area' });
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
      "Name: Kevin Tango",
      "Year of Birth: 1967",
      "UPRN: 10023714076.0",
      "Primary Support Reason: Sensory Support: Vi",
      "Disability: Activities limited a lot",
      "Coordinates: 50.72441687384, -1.2554246699389502",
      "Alert Category: Comorbidities",
      "Alert Detail: Open-Angle Glaucoma",
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
  async clickTransportInfrastructure() {
    const transportInfra = this.page.getByText("Transport Infrastructure");
    await transportInfra.waitFor({ state: "visible" });
    await transportInfra.click();
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "RoadCount: 16" })
      .getByRole("checkbox", { name: "controlled" })
      .check();
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "BridgeCount: 37" })
      .getByRole("checkbox", { name: "controlled" })
      .check();
    await this.page.waitForTimeout(3000);
    await this.page
      .locator("div")
      .filter({ hasText: /^A3054 Caul bourne Mill Race BridgebridgeTS048$/ })
      .nth(1)
      .click();
    await this.page.waitForTimeout(3000);
    await this.page.getByText("Asset Details").click();
    await this.page.waitForTimeout(3000);
    await this.page.getByText("View connected assets").click();
    await this.page.waitForTimeout(3000);
  }
  async assetsWithinAccordionIsVisible() {
    const dependentAssetAccordion = this.page.getByRole("heading", {
      name: "Road - A3054 Yarmouth to Newport",
    });
    expect(dependentAssetAccordion).toBeVisible();
  }

  async verifyAssetDetailsTabIsDisplayed() {
    await expect(
      this.page.getByRole("tab", { name: "Asset Details" }),
    ).toBeVisible();
  }

  async verifyLayersTabIsDisplayed() {
    await expect(this.page.getByRole("tab", { name: "Layers" })).toBeVisible();
  }
}
