import { screen, render, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { rest } from "msw";

import { ElementsProvider } from "context";
import { server } from "mocks/server";
import Dataset from "../Dataset";
import { mockEmptyRespose, mockError } from "mocks/resolvers/assessments";

describe("Categories component", () => {
  test("renders loading state when assessments are being fetched", async () => {
    render(<Dataset />, { wrapper: ElementsProvider });

    expect(await screen.findByText(/fetching assessments/i));
    await waitFor(() => expect(screen.queryByText("fetching assessments")).not.toBeInTheDocument());
    expect(await screen.findAllByRole("checkbox")).toHaveLength(2);
  });

  test("renders assessments with total count", async () => {
    render(<Dataset />, { wrapper: ElementsProvider });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });

  test.skip("renders message when assessments are not found", async () => {
    server.use(rest.get("/assessments", mockEmptyRespose));
    render(<Dataset />, { wrapper: ElementsProvider });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(await screen.findByText(/assessments not found/i)).toBeInTheDocument();
  });

  test.skip("renders message when an error occurs while fetching assessments", async () => {
    server.use(rest.get("/assessments", mockError));
    render(<Dataset />, { wrapper: ElementsProvider });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "Unable to retrieve categories. Please try again, if the problem persists contact admin."
      )
    ).toBeInTheDocument();
  });
});
