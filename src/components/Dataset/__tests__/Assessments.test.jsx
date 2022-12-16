import { rest } from "msw";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";

import server from "mocks";
import { ASSESSMENTS_ENDPOINT } from "constants/endpoints";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { PanelProviders } from "test-utils";

import Assessments from "../Assessments";

describe("Assessments component", () => {
  test("renders message when /assessments are not found", async () => {
    server.use(rest.get(ASSESSMENTS_ENDPOINT, mockEmptyResponse));
    render(<Assessments />, { wrapper: PanelProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(await screen.findByText(/assessments not found/i)).toBeInTheDocument();
  });

  test("renders error message when /assessments api call fails", async () => {
    server.use(rest.get(ASSESSMENTS_ENDPOINT, mockError));
    render(<Assessments />, { wrapper: PanelProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "An error occured while retrieving assessments. Please try again. If problem persists contact admin"
      )
    ).toBeInTheDocument();
  });
});
