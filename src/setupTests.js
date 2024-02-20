// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "jest-canvas-mock";
import { configure } from "@testing-library/react";
import { toMatchImageSnapshot } from "jest-image-snapshot";

import server from "./mocks";

expect.extend({ toMatchImageSnapshot });
configure({ testIdAttribute: "id" });
global.ResizeObserver = require("resize-observer-polyfill");

beforeAll(() => server.listen());
beforeEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
  window.localStorage.clear();
});
afterAll(() => server.close());

jest.mock("react-map-gl", () => ({
  __esModule: true,
  default: ({ children }) => <div id="telicentMap">{children}</div>,
  Source: ({ props, children }) => (
    <div {...props}>
      {props}
      {children}
    </div>
  ),
  Layer: (props) => <div {...props}></div>,
  MapProvider: ({ children }) => <div>{children}</div>,
  Marker: (props) => <div {...props}>{props.children}</div>,
  AttributionControl: () => <div>attribute control</div>,
  ScaleControl: () => <div>scale control</div>,
  useControl: () => ({}),
  useMap: () =>
    jest.fn().mockReturnValue({
      telicentMap: { zoomIn: jest.fn(), zoomOut: jest.fn() },
    }),
}));
