import { screen, render, waitForElementToBeRemoved, waitFor } from "@testing-library/react";
import { rest } from "msw";
import userEvent from "@testing-library/user-event";
import { Provider as UseHttpProvider } from "use-http";

import { ElementsProvider } from "context";
import server from "mocks";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { ErrorNotification } from "lib";
import { clickEnergyDataset, clickMedicalDataset, clickTransportDataset } from "test-utils";

import Dataset from "../Dataset";
import * as createData from "../dataset-utils";

const user = userEvent.setup();

const AllProviders = ({ children }) => (
  <UseHttpProvider options={{ cacheLife: 0, cachePolicy: "no-cache" }}>
    <ElementsProvider>{children}</ElementsProvider>
  </UseHttpProvider>
);

describe.only("Dataset panel", () => {
  test("collapses", async () => {
    render(<Dataset />, { wrapper: AllProviders });
    // await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    // await waitForElementToBeRemoved(() => screen.queryByText(/fetching data types/i));

    await user.click(screen.getByRole("button", { name: "Close dataset panel" }));
    expect(screen.queryByRole("checkbox", { name: "Energy [25]" })).not.toBeInTheDocument();
  });
});

describe.skip("Categories component", () => {
  test.skip("renders assessments with total count", async () => {
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });

  test("collapses", async () => {
    render(<Dataset />, { wrapper: AllProviders });
    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));

    await user.click(screen.getByRole("button", { name: "Close dataset panel" }));
    expect(screen.queryByRole("checkbox", { name: "Energy [25]" })).not.toBeInTheDocument();
  });

  test("renders message when assessments are not found", async () => {
    server.use(rest.get("/assessments", mockEmptyResponse));
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(await screen.findByText(/assessments not found/i)).toBeInTheDocument();
  });

  test.skip("renders error message when assessments api call fails", async () => {
    server.use(rest.get("/assessments", mockError));
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "Unable to retrieve categories. Please try again, if the problem persists contact admin."
      )
    ).toBeInTheDocument();
  });

  test.skip("renders error message when assessments/assets api call fails", async () => {
    const spyOnCreateData = jest.spyOn(createData, "createData");
    server.use(rest.get("/assessments/assets", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await clickEnergyDataset();
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());
  });

  test.skip("renders error message when assessments/connections api call fails", async () => {
    const spyOnCreateData = jest.spyOn(createData, "createData");
    server.use(rest.get("/assessments/connections", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await clickEnergyDataset();
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());
  });

  test.skip("renders error message when assets/:id/parts api call fails", async () => {
    const spyOnCreateData = jest.spyOn(createData, "createData");
    server.use(rest.get("/assets/:id/parts", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await clickTransportDataset();
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
    await waitFor(() => expect(spyOnCreateData).toHaveReturned());
  });

  test.skip("renders error message again after it's dismissed", async () => {
    server.use(
      ...[
        rest.get("/assessments/connections", mockError),
        rest.get("/assessments/assets", mockError),
      ]
    );

    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await clickEnergyDataset();
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "dismiss-error-notification" }));
    expect(screen.queryByText("Failed to resolve the data")).not.toBeInTheDocument();

    await clickMedicalDataset();
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
  });
});
