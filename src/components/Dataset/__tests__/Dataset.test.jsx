import { rest } from "msw";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import server from "mocks";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { renderWithQueryClient } from "test-utils";

import Dataset from "../Dataset";
import { createParalogEndpoint } from "api/utils";

const datasetURL = createParalogEndpoint("dataset");

describe("Dataset panel", () => {
  test("collapses", async () => {
    server.use(rest.get(datasetURL, mockEmptyResponse));
    renderWithQueryClient(<Dataset />);

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching dataset/i));
    expect(screen.queryByRole("checkbox", { name: "Energy [25]" })).not.toBeInTheDocument();
  });

  test("renders error message when /dataset api call fails", async () => {
    server.use(rest.get(datasetURL, mockError));
    renderWithQueryClient(<Dataset />);

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching dataset/i));
    expect(
      screen.getByText(
        "An error occured while retrieving dataset. Please try again. If problem persists contact admin"
      )
    ).toBeInTheDocument();
  });
});
