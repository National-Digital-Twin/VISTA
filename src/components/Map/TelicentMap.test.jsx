import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { CytoscapeProvider, ElementsProvider } from "../../context";
import { server } from "../../mocks/server";
import TelicentMap from "./TelicentMap";
import Categories from "./../Categories/Categories";
import MapboxMap from "./MapboxMap";

// jest.mock("./MapboxMap", () => ({
//   __esModule: true,
//   default: (props) => <div id="telicentMap" {...props}>map</div>,
// }));

jest.mock("react-map-gl", () => ({
  __esModule: true,
  default: ({ children }) => <div id="telicentMap">{children}</div>,
  Source: ({ props, children }) => <div {...props}>{props}{children}</div>,
  Layer: (props) => <div {...props}></div>,
  MapProvider: ({ children }) => <div>{children}</div>,
  useMap: () =>
    jest.fn().mockReturnValue({
      telicentMap: { zoomIn: jest.fn(), zoomOut: jest.fn() },
    }),
}));

const user = userEvent.setup();

describe("Map component", () => {
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test("renders map", async () => {
    const spy = jest.fn(MapboxMap, 'default')
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <Categories />
          <TelicentMap />
        </ElementsProvider>
      </CytoscapeProvider>
    );

    await waitFor(() => expect(screen.queryByText("Loading")).not.toBeInTheDocument());
    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();

    console.log("here ", spy)
    // expect(MapboxMap.props()).toHaveBeenCalledWith({ allAssets: [] })
    // await waitFor(() => expect(screen.queryByText("Loading Data")).not.toBeInTheDocument());
    screen.debug();
  });
});

// import puppeteer from "puppeteer";
// import puppeteer from "puppeteer";
/* const snapshotConfig = {
  failureThreshold: 0.01,
  failureThresholdType: "percent",
  customDiffConfig: { threshold: 0.5 },
};
 */

/* xdescribe("map ", () => {
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
    expect(image).toMatchImageSnapshot(snapshotConfig);
  });

  it("should load a grid when filter checkbox selected", async () => {
    await page.click('[id="http://telicent.io/test-data/iow#Water_Assessment"]');

    await sleep(2000);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot(snapshotConfig);
  });

  xit("should draw connections on map", async () => {
    await page.click('[id="http://telicent.io/test-data/iow#W007"]');
    await sleep(2000);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot(snapshotConfig);
  });

  afterAll(async () => {
    await browser.close();
  });
}); */
