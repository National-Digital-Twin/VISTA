import React from "react";
import { screen } from "@testing-library/react";
import { expandPanel, renderTestComponent } from "test-utils";
import InfoPanel from "../InfoPanel";

const Elements = ({ assets, connections, onElementClick }) => {
  const event = { originalEvent: { shiftKey: true } };
  return (
    <>
      <AssetBtn label="E001" assets={assets} event={event} onElementClick={onElementClick} />
      <AssetBtn label="E003" assets={assets} event={event} onElementClick={onElementClick} />
      <CxnBtn
        label="E001 - E003"
        connections={connections}
        event={event}
        onElementClick={onElementClick}
      />
    </>
  );
};

describe("Information panel component", () => {
  test("is closed by default", () => {
    renderTestComponent(<InfoPanel />);

    expect(screen.getByRole("button", { name: /open information panel/i })).toBeInTheDocument();
    expect(screen.getByTestId("information-panel").childNodes).toHaveLength(1);
  });

  test("opens and closes", async () => {
    const { user } = renderTestComponent(<InfoPanel />);

    await expandPanel(user);
    expect(screen.getByTestId("information-panel").childNodes.length).toBeGreaterThan(1);

    await user.click(screen.getByRole("button", { name: "Close information panel" }))
    expect(screen.getByTestId("information-panel").childNodes).toHaveLength(1);
  });

  test.skip("renders total count of selected elements", async () => {
    const { user } = renderTestComponent(<InfoPanel />, { });
    await expandPanel(user);

    const selectedBadge = screen.getByTestId("selected-badge");

    expect(selectedBadge).toHaveTextContent("1");
  });
});
