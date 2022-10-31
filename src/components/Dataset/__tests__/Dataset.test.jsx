import { screen, render, waitForElementToBeRemoved } from "@testing-library/react";
import { rest } from "msw";

import { ElementsProvider } from "context";
import { server } from "mocks/server";
import Dataset from "../Dataset";
import {
  mockEmptyRespose,
  mockError,
} from "mocks/resolvers/assessments";
import { Provider as UseHttpProvider } from "use-http";

const AllProviders = ({ children }) => (
  <UseHttpProvider options={{ cacheLife: 0, cachePolicy: "no-cache" }}>
    <ElementsProvider>{children}</ElementsProvider>
  </UseHttpProvider>
);

describe("Categories component", () => {
  test("renders assessments with total count", async () => {
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });

  test("renders message when assessments are not found", async () => {
    server.use(rest.get("/assessments", mockEmptyRespose));
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(await screen.findByText(/assessments not found/i)).toBeInTheDocument();
  });

  test("renders message when an error occurs while fetching assessments", async () => {
    server.use(rest.get("/assessments", mockError));
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "Unable to retrieve categories. Please try again, if the problem persists contact admin."
      )
    ).toBeInTheDocument();
  });
});
