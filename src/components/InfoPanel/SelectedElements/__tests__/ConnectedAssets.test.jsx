import { render, screen, within } from "@testing-library/react";

import { ElementsProvider } from "context";
import { E001_DETAILS, E025_DETAILS } from "mocks";
import { DSProvidersWrapper } from "test-utils";
import ConnectedAssets from "../ConnectedAssets";

const CONNECTED_ASSETS = [E025_DETAILS, E001_DETAILS];

const renderConnectedAssets = ({ connectedAssets, assets = [] }) => {
  return render(
    <DSProvidersWrapper>
      <ElementsProvider assets={assets}>
        <ConnectedAssets connectedAssets={connectedAssets} />
      </ElementsProvider>
    </DSProvidersWrapper>,
    { wrapper: ElementsProvider }
  );
};

describe("Connected assets component", () => {
  test("does NOT render assets when connected assets are not provided", () => {
    renderConnectedAssets([]);
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();
  });

  test("does NOT render assets when connected assets is not an array", () => {
    const { rerender } = renderConnectedAssets({});
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();

    rerender(<ConnectedAssets connectedAssets={"connected assets"} />);
    expect(screen.queryByRole("list")).toBeEmptyDOMElement();
  });

  test("renders connected asset details", () => {
    renderConnectedAssets({ connectedAssets: [CONNECTED_ASSETS[0]] });

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
    renderConnectedAssets({
      connectedAssets: CONNECTED_ASSETS,
      assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }],
    });

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(within(listItems[0]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "Fawley 132 kV Substation - Hants"
    );
    expect(within(listItems[1]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "East Cowes Power Station"
    );
  });

  test("renders colored asset icon when asset has been added", () => {
    renderConnectedAssets({
      connectedAssets: CONNECTED_ASSETS,
      assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }],
    });

    const listItems = screen.getAllByRole("listitem");
    expect(within(listItems[0]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "Fawley 132 kV Substation - Hants"
    );
    expect(within(listItems[0]).getByText("E025")).toBeInTheDocument();
    /*   
  Alecs - Improve telitypeicon accessibility
  expect(
      within(listItems[0]).getByTitle("HighVoltageElectricitySubstationComplex-icon")
    ).toBeInTheDocument(); */
  });

  test("renders greyscale asset icon when asset has not been added", () => {
    renderConnectedAssets({
      connectedAssets: CONNECTED_ASSETS,
      assets: [{ uri: "https://www.iow.gov.uk/DigitalTwin#E001" }],
    });

    const listItems = screen.getAllByRole("listitem");
    expect(within(listItems[1]).getByRole("heading", { level: 4 })).toHaveTextContent(
      "East Cowes Power Station"
    );
    expect(within(listItems[1]).getByText("E001")).toBeInTheDocument();
    /* expect(within(listItems[1]).getByTestId("asset-icon")).toHaveStyle({
      backgroundColor: "rgb(163, 163, 163)",
      color: "rgb(51, 51, 51)",
    });
    expect(within(listItems[1]).getByTestId("asset-icon").firstElementChild).toHaveClass(
      "fa-solid fa-utility-pole-double"
    ); */
  });
});
