import { render, screen, within } from "@testing-library/react";
import { ElementsContext, ElementsProvider } from "context";
import { E001_DETAILS, E025_DETAILS } from "mocks";
import { default as ConnectedAssets } from "../ConnectedAssets";

const CONNECTED_ASSETS = [E025_DETAILS, E001_DETAILS];

describe("Connected assets component", () => {
  test("does NOT render assets when connected assets are not provided", () => {
    render(<ConnectedAssets connectedAssets={[]} />, { wrapper: ElementsProvider });
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();
  });

  test("does NOT render assets when connected assets is not an array", () => {
    const { rerender } = render(<ConnectedAssets connectedAssets={{}} />, {
      wrapper: ElementsProvider,
    });
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();

    rerender(<ConnectedAssets connectedAssets={"connected assets"} />);
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();
  });

  test("renders connected asset details", () => {
    render(<ConnectedAssets connectedAssets={[CONNECTED_ASSETS[0]]} />, {
      wrapper: ElementsProvider,
    });

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(1);

    expect(within(listItems[0]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "Fawley 132 kV Substation - Hants"
    );
    expect(
      within(listItems[0]).getByText("high voltage electricity substation complex")
    ).toBeInTheDocument();
    expect(within(listItems[0]).getByText("E025")).toBeInTheDocument();
    expect(within(listItems[0]).getByText("Criticality: 8")).toBeInTheDocument();
    expect(within(listItems[0]).getByText("Connection Strength: 3")).toBeInTheDocument();
  });

  test("renders added assets first", () => {
    render(
      <ElementsContext.Provider
        value={{ assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }] }}
      >
        <ConnectedAssets connectedAssets={CONNECTED_ASSETS} />
      </ElementsContext.Provider>
    );

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(within(listItems[0]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "East Cowes Power Station"
    );
    expect(within(listItems[1]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "Fawley 132 kV Substation - Hants"
    );
  });

  test("renders colored asset icon when asset has been added", () => {
    render(
      <ElementsContext.Provider
        value={{ assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }] }}
      >
        <ConnectedAssets connectedAssets={CONNECTED_ASSETS} />
      </ElementsContext.Provider>
    );

    const listItems = screen.getAllByRole("listitem");
    expect(within(listItems[0]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "East Cowes Power Station"
    );
    expect(within(listItems[0]).getByText("E001")).toBeInTheDocument();
    expect(within(listItems[0]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(255, 255, 0)",
      color: "black",
    });
    expect(within(listItems[0]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-regular fa-bolt-lightning"
    );
  });

  test("renders greyscale asset icon when asset has not been added", () => {
    render(
      <ElementsContext.Provider
        value={{ assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }] }}
      >
        <ConnectedAssets connectedAssets={CONNECTED_ASSETS} />
      </ElementsContext.Provider>
    );

    const listItems = screen.getAllByRole("listitem");
    expect(within(listItems[1]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "Fawley 132 kV Substation - Hants"
    );
    expect(within(listItems[1]).getByText("E025")).toBeInTheDocument();
    expect(within(listItems[1]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(listItems[1]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-solid fa-utility-pole-double"
    );
  });
});
