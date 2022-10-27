import { screen, render, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { rest } from "msw";

import { ElementsProvider } from "context";
import { server } from "mocks/server";
import Dataset from "./Dataset";

describe("Categories component", () => {
  beforeAll(() => {
    server.listen();
  });
  beforeEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  server.printHandlers()

  test("renders assessments with total count", async () => {
    render(<Dataset />, { wrapper: ElementsProvider });

    expect(await screen.findAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Transport [44]" })).toBeInTheDocument();
  });

  test("renders loading state when assessments are being fetched", async () => {
    // server.use(
    //   rest.get('/assessments', (req, res, ctx) => {
    //     return res.once(
    //       ctx.delay(500),
    //       ctx.status(200),
    //       ctx.json([
    //         {
    //           uri: "http://telicent.io/fake_data#Energy_Assessment",
    //           name: "Energy",
    //           assCount: "25",
    //         },
    //       ])
    //     );
    //   })
    // );
    render(<Dataset />, { wrapper: ElementsProvider });

    expect(await screen.findByText(/fetching assessments/i));
    await waitFor(() => expect(screen.queryByText("fetching assessments")).not.toBeInTheDocument());
  });

  test.skip("renders message when assessments are not found", async () => {
    server.use(
      rest.get('/assessments', (req, res, ctx) => {
        console.log("RETURN []")
        return res.once(ctx.status(200), ctx.json([]));
      })
    );
    render(<Dataset />, { wrapper: ElementsProvider });

    await waitForElementToBeRemoved(() => screen.queryByText(/fetching assessments/i));
    expect(screen.getByText(/assessments not found/i)).toBeInTheDocument();
  });
});
