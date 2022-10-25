import { screen, waitFor, within } from "@testing-library/react";
import React from "react";

import TelicentMap from "./TelicentMap";
import * as mapboxFeatures from "./mapboxFeatures";
import * as utils from "./../Categories/utils";
import { AssetBtn, CxnBtn, renderTestComponent } from "../../test-utils";

jest.mock("react-map-gl", () => ({
  __esModule: true,
  default: ({ children }) => <div id="telicentMap">{children}</div>,
  Source: ({ props, children }) => (
    <div {...props}>
      {props}
      {children}
    </div>
  ),
  Layer: (props) => <div {...props}></div>,
  MapProvider: ({ children }) => <div>{children}</div>,
  useMap: () =>
    jest.fn().mockReturnValue({
      telicentMap: { zoomIn: jest.fn(), zoomOut: jest.fn() },
    }),
}));

const selectDatasets = async (user, datasets) => {
  const spyOnCreateData = jest.spyOn(utils, "createData");

  for (const dataset of datasets) {
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: dataset })).toBeInTheDocument()
    );
    await user.click(await screen.findByRole("checkbox", { name: dataset }));
    expect(screen.getByRole("checkbox", { name: dataset })).toBeChecked();
  }

  await waitFor(() => expect(spyOnCreateData).toHaveReturned());
};

const TestBtns = ({ assets, connections, onElementClick }) => {
  const event = { originalEvent: { shiftKey: false } };
  return (
    <>
      <AssetBtn label="E005" assets={assets} event={event} onElementClick={onElementClick} />
      <CxnBtn
        label="E005 - E006"
        connections={connections}
        event={event}
        onElementClick={onElementClick}
      />
    </>
  );
};

const MultiSelectTestBtns = ({ assets, connections, onElementClick }) => {
  const event = { originalEvent: { shiftKey: true } };
  const assetLabels = ["E001", "E012", "M001", "M022", "M023"];
  const cxnLabels = ["E005 - E006", "E012 - M022", "E012 - M023"];
  return (
    <>
      {assetLabels.map((label) => (
        <AssetBtn key={label} label={label} assets={assets} event={event} onElementClick={onElementClick} />
      ))}
      {cxnLabels.map((label) => (
        <CxnBtn
          key={label}
          label={label}
          connections={connections}
          event={event}
          onElementClick={onElementClick}
        />
      ))}
    </>
  );
};

describe("Map component", () => {
  test("generates selected all assets", async () => {
    const spyOnGenerateAssetFeatures = jest.spyOn(mapboxFeatures, "generateAssetFeatures");
    const { user } = renderTestComponent(<TelicentMap />);
    await selectDatasets(user, ["Energy [25]"]);

    expect(spyOnGenerateAssetFeatures).toHaveReturned();
  });

  test("generates selected assets when an asset is clicked", async () => {
    const spyOnCreateSelectedAssetFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedAssetFeatures"
    );
    const spyOnCreateSelectedCxnFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedConnectionFeatures"
    );
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: TestBtns });
    await selectDatasets(user, ["Energy [25]"]);

    expect(screen.getAllByTestId("asset")).toHaveLength(5);
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });

  test("generates selected connections", async () => {
    const spyOnCreateSelectedAssetFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedAssetFeatures"
    );
    const spyOnCreateSelectedCxnFeatures = jest.spyOn(
      mapboxFeatures,
      "createSelectedConnectionFeatures"
    );
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: TestBtns });
    await selectDatasets(user, ["Energy [25]"]);

    expect(screen.getAllByTestId("asset")).toHaveLength(5);
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });
});

describe("Map component: Filtering dataset when an asset(s) is selected", () => {
  test("does NOT render selected energy elements when energy dataset is deselected", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(screen.getByRole("button", { name: "E012" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(1);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E012")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#E012")
    ).not.toBeInTheDocument();
  });

  test("renders medical selected elements when energy dataset is deselected", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(screen.getByRole("button", { name: "E012" }));
    await user.click(screen.getByRole("button", { name: "M022" }));
    await user.click(screen.getByRole("button", { name: "M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(2));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#M022")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#M023")
    ).toBeInTheDocument();
  });
});

describe("Map component: Filtering dataset when a connection(s) is selected", () => {
  test("does NOT render selected energy elements when energy dataset is deselected", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(1);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#connector_E005_E006")
    ).not.toBeInTheDocument();
  });

  test("renders energy selected elements when medical dataset is deselected: connections", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    await user.click(screen.getByRole("button", { name: "E012 - M022" }));
    await user.click(screen.getByRole("button", { name: "E012 - M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Medical [32]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(1));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();
  });
});

describe("Map component: Filtering dataset when an asset(s) and connection(s) are selected", () => {
  test("does NOT render selected energy elements when energy dataset is deselected", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");
    await user.click(screen.getByRole("button", { name: "E012" }));
    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(2);
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E012")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Energy [25]" }));
    await waitFor(() =>
      expect(within(selectedElements).queryAllByTestId("selected-element")).toHaveLength(0)
    );
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#E012")
    ).not.toBeInTheDocument();
    expect(
      within(selectedElements).queryByText("http://telicent.io/fake_data#connector_E005_E006")
    ).not.toBeInTheDocument();
  });

  test("renders energy selected elements when medical dataset is deselected: assets and connections", async () => {
    const { user } = renderTestComponent(<TelicentMap />, { testComponent: MultiSelectTestBtns });
    await selectDatasets(user, ["Energy [25]", "Medical [32]"]);

    const selectedElements = screen.getByTestId("selected-elements");
    await user.click(screen.getByRole("button", { name: "E001" }));
    await user.click(screen.getByRole("button", { name: "M001" }));
    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    await user.click(screen.getByRole("button", { name: "E012 - M022" }));
    await user.click(screen.getByRole("button", { name: "E012 - M023" }));
    expect(within(selectedElements).getAllByTestId("selected-element")).toHaveLength(5);

    await user.click(screen.getByRole("checkbox", { name: "Medical [32]" }));
    await waitFor(() => expect(screen.getAllByTestId("selected-element")).toHaveLength(2));
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#E001")
    ).toBeInTheDocument();
    expect(
      within(selectedElements).getByText("http://telicent.io/fake_data#connector_E005_E006")
    ).toBeInTheDocument();
  });
});
