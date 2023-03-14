import { rest } from "msw";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";

import server from "mocks";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { renderWithQueryClient } from "test-utils";

import Assessments from "../Assessments";
import { createParalogEndpoint } from "endpoints";

const assessmentsURL = createParalogEndpoint("assessments");

describe("Assessments component", () => {
  test("renders message when /assessments are not found", async () => {
    server.use(rest.get(assessmentsURL, mockEmptyResponse));
    renderWithQueryClient(<Assessments />);

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(await screen.findByText(/assessments not found/i)).toBeInTheDocument();
  });

  test("renders error message when /assessments api call fails", async () => {
    server.use(rest.get(assessmentsURL, mockError));
    renderWithQueryClient(<Assessments />);

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "An error occured while retrieving assessments. Please try again. If problem persists contact admin"
      )
    ).toBeInTheDocument();
  });
});
