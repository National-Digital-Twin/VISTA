import { screen, render, waitForElementToBeRemoved, waitFor } from "@testing-library/react";
import { rest } from "msw";
import userEvent from "@testing-library/user-event";

import { ElementsProvider } from "context";
import server from "mocks";
import Dataset from "../Dataset";
import { mockEmptyRespose, mockError } from "mocks/resolvers";
import { Provider as UseHttpProvider } from "use-http";
import ErrorNotification from "lib/ErrorNotification";

const user = userEvent.setup();

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

  test("renders error message when assessments api call fails", async () => {
    server.use(rest.get("/assessments", mockError));
    render(<Dataset />, { wrapper: AllProviders });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(
      screen.getByText(
        "Unable to retrieve categories. Please try again, if the problem persists contact admin."
      )
    ).toBeInTheDocument();
  });

  test("renders error message when assessments/assets api call fails", async () => {
    server.use(rest.get("/assessments/assets", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
  });
  
  test("renders error message when assessments/connections api call fails", async () => {
    server.use(rest.get("/assessments/connections", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
  });

  test("renders error message when assets/:id/parts api call fails", async () => {
    server.use(rest.get("/assets/:id/parts", mockError));
    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await user.click(await screen.findByRole("checkbox", { name: "Transport [44]" }));
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
  });

  test("renders error message again after it's dismissed", async () => {
    server.use(...[rest.get("/assessments/connections", mockError), rest.get("/assessments/assets", mockError)]);

    render(
      <>
        <ErrorNotification />
        <Dataset />
      </>,
      { wrapper: AllProviders }
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
    
    await waitFor(() => expect(screen.getByTestId("error-notification")).toHaveClass("show"))
    expect(screen.getByText("Failed to resolve the data")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "dismiss-error-notification" }));
    await waitFor(() => expect(screen.getByTestId("error-notification")).toHaveClass("hide"));
    expect(screen.queryByText("Failed to resolve the data")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
    await waitFor(() => expect(screen.getByTestId("error-notification")).toHaveClass("show"))
    expect(await screen.findByText("Failed to resolve the data")).toBeInTheDocument();
  })
});
