import { render } from "@testing-library/react";
import DataPresentation from ".";
import { AssetContext } from "../AssetContext";
import Asset from "../models/Asset";
import { ElementsContext } from "../ElementsContext";
import ConnectionAssessment from "../models/ConnectionAssessment";

const mockDetails = jest.fn();
const mockMap = jest.fn();

jest.mock("../Details", () => (props) => {
  mockDetails(props);
  return <div>Details</div>;
});

jest.mock("../Map/TelicentMap", () => (props) => {
  mockMap(props);
  return <div>Map</div>;
});

const renderWithContexts = (
  ui,
  { AssetContextProps, ElementsContextProps, ...renderOptions }
) => {
  return render(
    <ElementsContext.Provider {...ElementsContextProps}>
      <AssetContext.Provider {...AssetContextProps}>{ui}</AssetContext.Provider>
    </ElementsContext.Provider>,
    renderOptions
  );
};

describe("DataPresentation should call details and map with correct props", () => {
  const sourceAsset = new Asset({
    item: {
      name: "asset1",
      type: "test",
      id: 1,
      uri: "http://asset1.com",
    },
    idx: 1,
  });

  const targetAsset = new Asset({
    item: {
      name: "asset2",
      type: "test",
      id: 2,
      uri: "http://asset2.com",
    },
  });

  const connection = new ConnectionAssessment({
    item: {
      connUri: "http://asset1_asset2.com",
      asset1Uri: sourceAsset.uri,
      asset2Uri: targetAsset.uri,
    },
    source: sourceAsset,
    target: targetAsset,
    criticality: 1,
  });

  const Assets = [sourceAsset, targetAsset];

  const ElementsContextProps = {
    value: {
      elements: {
        assets: Assets,
        connections: [connection],
      },
      updateElements: jest.fn,
    },
  };

  it("should call details and map if valid asset selected", () => {
    const type = "asset";
    const AssetContextProps = {
      value: {
        selected: "http://asset1.com",
        type,
      },
    };

    renderWithContexts(<DataPresentation />, {
      AssetContextProps,
      ElementsContextProps,
    });

    expect(mockDetails).toHaveBeenLastCalledWith({
      element: sourceAsset,
      type,
    });

    expect(mockMap).toHaveBeenLastCalledWith({
      element: sourceAsset,
      type,
    });
  });

  it("should call details and map with correct props if valid connection selected", () => {
    const type = "connection";
    const AssetContextProps = {
      value: {
        selected: "http://asset1_asset2.com",
        type,
      },
    };

    renderWithContexts(<DataPresentation />, {
      AssetContextProps,
      ElementsContextProps,
    });

    expect(mockDetails).toHaveBeenLastCalledWith({
      element: connection,
      type,
    });

    expect(mockMap).toHaveBeenLastCalledWith({
      element: connection,
      type,
    });
  });
});
