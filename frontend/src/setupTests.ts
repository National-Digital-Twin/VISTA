import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

// mockout featureFlags to avoid import.meta issues without babel transforms
jest.mock("./config/feature-flags", () => ({
  default: {
    devTools: true,
    routing: true,
    uiNext: true,
    pageHeader: false,
    feedbackWidget: false,
    environmentallySensitiveAreas: true,
    assetTable: true,
  },
}));
