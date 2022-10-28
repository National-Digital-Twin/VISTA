// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "jest-canvas-mock";
import { configure } from "@testing-library/react";
import { toMatchImageSnapshot } from "jest-image-snapshot";

import { server } from "mocks/server";

expect.extend({ toMatchImageSnapshot });
configure({ testIdAttribute: "id" });

global.window._env_ = {
  API_URL: "http://localhost:5051",
  MAPBOX_TOKEN: "test_key",
  MAP_URL: "http://map.com",
};
global.ResizeObserver = require("resize-observer-polyfill");

process.env = {
  ...process.env,
  API_URL: "http://localhost:5051",
  MAPBOX_TOKEN: "test_key",
  MAP_URL: "http://map.com",
};

beforeAll(() => server.listen());
beforeEach(() => {
  jest.clearAllMocks();
  server.resetHandlers();
  // jest.restoreAllMocks();
  // console.log("before each", server.listHandlers())
});
afterAll(() => server.close());
