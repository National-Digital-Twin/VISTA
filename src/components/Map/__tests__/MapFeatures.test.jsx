import { render } from "@testing-library/react";
import React from "react";

import { CytoscapeProvider, ElementsContext, ElementsProvider } from "context";
import { getCreatedAssets, getCreatedDependencies } from "test-utils";
import {
  HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
  T020_SEGMENTS,
  T034_SEGMENTS,
  TRANSPORT_ASSETS,
} from "mocks";

import TelicentMap from "../TelicentMap";
import * as mapboxFeatures from "../map-utils";

const MapComponent = ({ assets = [], dependencies = [], selectedElements = [] }) => (
  <CytoscapeProvider>
    <ElementsContext.Provider
      value={{
        assets,
        dependencies,
        selectedElements,
        clearSelectedElements: jest.fn(),
        onElementClick: jest.fn(),
      }}
    >
      <TelicentMap />
    </ElementsContext.Provider>
  </CytoscapeProvider>
);

describe("Map component", () => {
  test("should generate empty features when there are no elements", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    render(
      <CytoscapeProvider>
        <ElementsProvider>
          <TelicentMap />
        </ElementsProvider>
      </CytoscapeProvider>
    );

    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate point asset features", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const createdAssets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    render(<MapComponent assets={createdAssets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should generate linear asset features", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const createdAssets = await getCreatedAssets(
      TRANSPORT_ASSETS,
      ["T043"],
      jest.fn(),
      jest.fn().mockReturnValue(T034_SEGMENTS)
    );
    render(<MapComponent assets={createdAssets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets).toHaveLength(1);
    expect(spyOnGenerateFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should generate dependencies", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const createdAssets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    const createdDependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    render(<MapComponent assets={createdAssets} dependencies={createdDependencies} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(1);
    expect(spyOnGenerateFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate dependencies when there are no assets", () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const createdDependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    render(<MapComponent dependencies={createdDependencies} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate features when elements are selected", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    const dependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    render(
      <MapComponent
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(2);

    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      true
    );

    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(1);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);
    expect(spyOnGenerateFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate features for selected elements which don't exist", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS, [
      "E003",
      "E025",
    ]);
    const selectedElements = await getCreatedAssets(OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS, [
      "E001",
    ]);
    render(<MapComponent assets={assets} selectedElements={selectedElements} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      false
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      false
    );
    expect(spyOnGenerateFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate point asset features when previously selected assets are removed", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS, [
      "E003",
      "E025",
    ]);
    const { rerender } = render(<MapComponent assets={assets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      true
    );

    rerender(<MapComponent assets={[]} selectedElements={assets} />);
    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate selected point asset features for selected assets which exist", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E025", "E003"]
    );
    const { rerender } = render(<MapComponent assets={assets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(3);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[2].properties.selected).toBe(
      true
    );

    const filteredAssets = assets.filter((asset) => {
      const typeFilter = "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex";
      const isOilFiredAsset = asset.type === typeFilter;
      return isOilFiredAsset;
    });
    rerender(<MapComponent assets={filteredAssets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssets).toHaveLength(1);
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssets[0].properties.selected).toBe(
      true
    );
  });

  test("should NOT generate linear asset features when previously selected assets are removed", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      TRANSPORT_ASSETS,
      ["T043"],
      jest.fn(),
      jest.fn().mockReturnValue(T034_SEGMENTS)
    );
    const { rerender } = render(<MapComponent assets={assets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets).toHaveLength(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets[0].properties.selected).toBe(
      true
    );

    rerender(<MapComponent assets={[]} selectedElements={assets} />);
    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate selected linear asset features for selected assets which exist", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      TRANSPORT_ASSETS,
      ["T043", "T020"],
      jest.fn(),
      jest
        .fn()
        .mockReturnValueOnce(T034_SEGMENTS)
        .mockReturnValueOnce(T020_SEGMENTS)
        .mockReturnValue([])
    );
    const { rerender } = render(<MapComponent assets={assets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.linearAssets[1].properties.selected).toBe(
      true
    );

    const filteredAssets = assets.filter((asset) => {
      const typeFilter = "http://ies.data.gov.uk/ontology/ies4#HeavyRailComplex";
      const isHeavyRailComplex = asset.type === typeFilter;
      return isHeavyRailComplex;
    });
    rerender(<MapComponent assets={filteredAssets} selectedElements={assets} />);

    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures.mock.results[1].value.linearAssets).toHaveLength(1);
    expect(spyOnGenerateFeatures.mock.results[1].value.linearAssets[0].properties.selected).toBe(
      true
    );
  });

  test("should NOT generate dependency features when previously dependencies when assets are removed", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    const dependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    const { rerender } = render(
      <MapComponent assets={assets} dependencies={dependencies} selectedElements={dependencies} />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(1);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);

    rerender(<MapComponent assets={[]} dependencies={[]} selectedElements={dependencies} />);
    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate selected dependency features for assets which exist", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E025", "E003"]
    );
    const dependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003", "E003 - E025"]
    );
    const { rerender } = render(
      <MapComponent assets={assets} dependencies={dependencies} selectedElements={dependencies} />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(2);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[1].properties.selected
    ).toBe(true);

    const filteredAssets = assets.filter((asset) => {
      const typeFilter =
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex";
      const isHighVoltageAsset = asset.type === typeFilter;
      return isHighVoltageAsset;
    });

    rerender(
      <MapComponent
        assets={filteredAssets}
        dependencies={dependencies}
        selectedElements={dependencies}
      />
    );
    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssetDependencies).toHaveLength(1);
    expect(
      spyOnGenerateFeatures.mock.results[1].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);
  });

  test("should NOT generate point asset and dependency features when previoulsy selected elements are removed", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"]
    );
    const dependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    const { rerender } = render(
      <MapComponent
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    // Point assets
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      true
    );

    // Point asset dependencies
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(1);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);

    rerender(
      <MapComponent assets={[]} dependencies={[]} selectedElements={[...assets, ...dependencies]} />
    );
    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    expect(spyOnGenerateFeatures).toHaveReturnedWith({
      pointAssets: [],
      pointAssetDependencies: [],
      linearAssets: [],
    });
  });

  test("should generate selected point asset and dependency features for elements which exist", async () => {
    const spyOnGenerateFeatures = jest.spyOn(mapboxFeatures, "generateFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E025", "E003"]
    );
    const dependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003", "E003 - E025"]
    );
    const { rerender } = render(
      <MapComponent
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(1);
    // Point assets
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets).toHaveLength(3);
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[1].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssets[2].properties.selected).toBe(
      true
    );

    // Point asset dependencies
    expect(spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies).toHaveLength(2);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);
    expect(
      spyOnGenerateFeatures.mock.results[0].value.pointAssetDependencies[1].properties.selected
    ).toBe(true);

    const typeFilter = "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex";
    const filteredAssets = assets.filter((asset) => {
      const isOilFiredAsset = asset.type === typeFilter;
      return !isOilFiredAsset;
    });
    const filteredDependencies = dependencies.filter((dependency) => {
      const isOilFiredAsset =
        dependency.dependent.type === typeFilter || dependency.provider.type === typeFilter;
      return !isOilFiredAsset;
    });
    rerender(
      <MapComponent
        assets={filteredAssets}
        dependencies={filteredDependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGenerateFeatures).toBeCalledTimes(2);
    // Point assets
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssets).toHaveLength(2);
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssets[0].properties.selected).toBe(
      true
    );
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssets[1].properties.selected).toBe(
      true
    );
    // Point asset dependencies
    expect(spyOnGenerateFeatures.mock.results[1].value.pointAssetDependencies).toHaveLength(1);
    expect(
      spyOnGenerateFeatures.mock.results[1].value.pointAssetDependencies[0].properties.selected
    ).toBe(true);
  });
});
