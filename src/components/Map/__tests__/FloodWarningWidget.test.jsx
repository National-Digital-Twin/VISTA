import { render, screen } from "@testing-library/react";
import { setup } from "test-utils";

import FloodWarningWidget from "../FloodAreaWidget";

describe("Flood warning widget", () => {
  test("renders closed by default", () => {
    render(<FloodWarningWidget />);

    expect(screen.getByRole("button", { name: "Flood warnings" })).toBeInTheDocument();
    expect(screen.getByTestId("flood-warnings-iframe")).toHaveAttribute("width", "0px");
  });

  test("opens when clicked", async () => {
    const { user } = setup(<FloodWarningWidget />);
    await user.click(screen.getByRole("button", { name: "Flood warnings" }));

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByTestId("flood-warnings-iframe")).toHaveAttribute("width", "355px");
  });
});
