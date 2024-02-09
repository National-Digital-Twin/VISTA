import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider as UseHttpProvider } from "use-http";

import { ElementsProvider } from "context";
import { DSProvidersWrapper, renderWithQueryClient } from "test-utils";
import Dataset from "../Dataset";

const user = userEvent.setup();

const AllProviders = ({ children }) => (
  <UseHttpProvider options={{ cacheLife: 0, cachePolicy: "no-cache" }}>
    <ElementsProvider>
      <DSProvidersWrapper>{children}</DSProvidersWrapper>
    </ElementsProvider>
  </UseHttpProvider>
);

describe("Dataset panel", () => {
  test("collapses", async () => {
    renderWithQueryClient(<Dataset />, { wrapper: AllProviders });

    await user.click(screen.getByRole("button", { name: "Close dataset panel" }));
    expect(screen.queryByRole("checkbox", { name: "Energy [25]" })).not.toBeInTheDocument();
  });
});
