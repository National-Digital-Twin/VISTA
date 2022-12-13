import { screen } from "@testing-library/react";
import React from "react";

import TelicentMap from "../TelicentMap";
import * as mapboxFeatures from "../mapboxFeatures";
import { AssetBtn, CxnBtn, renderTestComponent, selectDatasets } from "../../../test-utils";

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

describe.skip("Map component: Generates features which are used by mapbox", () => {
  test("generates asset features when data is added", async () => {
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
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(2);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(2);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });

  test("generates selected connections when an connection is clicked", async () => {
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
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(2);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturnedWith([]);

    expect(screen.getAllByTestId("cxn")).toHaveLength(4);
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(2);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturnedWith([]);

    await user.click(screen.getByRole("button", { name: "E005 - E006" }));
    expect(spyOnCreateSelectedAssetFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedAssetFeatures).toHaveReturned();
    expect(spyOnCreateSelectedCxnFeatures).toHaveBeenCalledTimes(3);
    expect(spyOnCreateSelectedCxnFeatures).toHaveReturned();
  });
});
