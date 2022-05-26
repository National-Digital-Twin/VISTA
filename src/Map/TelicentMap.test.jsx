import puppeteer from "puppeteer";

describe("map ", () => {
  jest.setTimeout(8000);
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  it("should load filters", async () => {
    await page.goto("http://localhost:3001", {
      waitUntil: "networkidle2",
    });

    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();
  });

  it("should load a grid when filter checkbox selected", async () => {
    await page.click(
      '[id="http://telicent.io/test-data/iow#Water_Assessment"]'
    );

    await sleep(2000);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();
  });

  it("should draw connections on map", async () => {
    await page.click('[id="http://telicent.io/test-data/iow#W007"]');
    await sleep(2000);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();
  });

  afterAll(async () => {
    await browser.close();
  });
});
