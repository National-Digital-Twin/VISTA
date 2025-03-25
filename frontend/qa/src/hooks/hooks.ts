import { BeforeAll, AfterAll, Before, After, Status } from "@cucumber/cucumber";
import { Browser, BrowserContext } from "@playwright/test";
import { basePage } from "./basePage";
import { invokeBrowser } from "../helper/browsers/browserManager";
import { getEnv } from "../helper/env/env";
import { createLogger } from "winston";
import { options } from "../helper/util/logger";
const fs = require("fs-extra");

let browser: Browser;
let context: BrowserContext;

BeforeAll(async function () {
  getEnv();
  browser = await invokeBrowser();
});
// It will trigger for not auth scenarios
Before({ tags: "not @auth" }, async function ({ pickle }) {
  const scenarioName = pickle.name + pickle.id;
  context = await browser.newContext({
    recordVideo: {
      dir: "test-results/videos",
    },
  });
  await context.tracing.start({
    name: scenarioName,
    title: pickle.name,
    sources: true,
    screenshots: true,
    snapshots: true,
  });
  const page = await context.newPage();
  basePage.page = page;
  basePage.logger = createLogger(options(scenarioName));
});

// It will trigger for auth scenarios
Before({ tags: "@auth" }, async function ({ pickle }) {
  const scenarioName = pickle.name + pickle.id;
  context = await browser.newContext({
    storageState: getStorageState(pickle.name),
    recordVideo: {
      dir: "test-results/videos",
    },
  });
  await context.tracing.start({
    name: scenarioName,
    title: pickle.name,
    sources: true,
    screenshots: true,
    snapshots: true,
  });
  const page = await context.newPage();
  basePage.page = page;
  basePage.logger = createLogger(options(scenarioName));
});

After(async function TestCaseHook({ pickle, result }) {
  let videoPath: string | undefined;
  let img: Buffer | undefined;
  const path = `./test-results/trace/${pickle.id}.zip`;

  if (result?.status === Status.PASSED) {
    try {
      img = await basePage.page.screenshot({
        path: `./test-results/screenshots/${pickle.name}.png`,
        type: "png",
      });

      const video = basePage.page.video();
      if (video) {
        videoPath = await video.path();
      } else {
        console.warn("No video recorded for this test.");
      }
    } catch (error) {
      console.error("Error capturing screenshot or video:", error);
    }
  }

  await context.tracing.stop({ path });
  await basePage.page?.close();
  await context.close();

  console.log("FS Module:", fs); // Debugging line

  if (result?.status === Status.PASSED) {
    attachFiles(img, videoPath, path);
  }
});

AfterAll(async function () {
  await browser.close();
});

function attachFiles(img : any, videoPath : string, path : string) {
  if (img) {
    this.attach(img, "image/png");
  }

  if (videoPath && fs?.existsSync(videoPath)) {
    try {
      this.attach(fs.readFileSync(videoPath), "video/webm");
    } catch (error) {
      console.error(`Error attaching video: ${videoPath}`, error);
    }
  } else {
    console.warn(`Video file not found at path: ${videoPath}`);
  }

  const traceFileLink = `<a href="https://trace.playwright.dev/">Open ${path}</a>`;
  this.attach(`Trace file: ${traceFileLink}`, "text/html");
}

function getStorageState(user: string):
  | string
  | {
      cookies: {
        name: string;
        value: string;
        domain: string;
        path: string;
        expires: number;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "Strict" | "Lax" | "None";
      }[];
      origins: {
        origin: string;
        localStorage: { name: string; value: string }[];
      }[];
    } {
  if (user.endsWith("admin")) return "src/helper/auth/admin.json";
  else if (user.endsWith("lead")) return "src/helper/auth/lead.json";
}
