import { screen } from "@testing-library/react";
import {
  HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
  HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
  OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
} from "mocks";
import { getCreatedAssets, getCreatedDependencies, renderWithQueryClient } from "test-utils";
import * as mapUtils from "../map-utils";
import PointAssets from "../PointAssets";

const getLineStringFeatures = (feature) => feature.geometry.type === "LineString";
const getPointFeatures = (feature) => feature.geometry.type === "Point";

describe("Point asset component", () => {
  test("should generate empty features when there are no elements", () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    renderWithQueryClient(<PointAssets />);

    expect(spyOnGeneratePointAssetFeatures).toHaveReturnedWith([]);
  });

  test("should generate asset features", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    const createdAssets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E003"],
      jest.fn().mockResolvedValue({}),
      jest.fn()
    );
    renderWithQueryClient(<PointAssets assets={createdAssets} />);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(2);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toMatchSnapshot();
    expect(screen.getByTestId("https://www.iow.gov.uk/DigitalTwin#E003")).toBeInTheDocument();
    expect(screen.getByTestId("https://www.iow.gov.uk/DigitalTwin#E001")).toBeInTheDocument();
  });

  test("should generate dependency features", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    renderWithQueryClient(
      <PointAssets assets={createdAssets} dependencies={createdDependencies} />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(3);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate dependencies when there are no assets", () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    const createdDependencies = getCreatedDependencies(
      HIGH_VOLTAGE_ELECTRICITY_AND_OIL_FIRED_POWER_GENERATION_SUBSTATION_COMPLEX_DEPENDENCIES,
      ["E001 - E003"]
    );
    renderWithQueryClient(<PointAssets dependencies={createdDependencies} />);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures).toHaveReturnedWith([]);
  });

  test("should generate features when elements are selected", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    renderWithQueryClient(
      <PointAssets
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(3);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[0].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[1].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[2].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate features for selected elements which don't exist", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    const assets = await getCreatedAssets(HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS, [
      "E003",
      "E025",
    ]);
    const selectedElements = await getCreatedAssets(OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS, [
      "E001",
    ]);
    renderWithQueryClient(<PointAssets assets={assets} selectedElements={selectedElements} />);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(2);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[0].properties.selected).toBe(
      false
    );
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[1].properties.selected).toBe(
      false
    );
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toMatchSnapshot();
  });

  test("should NOT generate point asset features when previously selected assets are removed", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    const assets = await getCreatedAssets(HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS, [
      "E003",
      "E025",
    ]);
    const { rerender } = renderWithQueryClient(
      <PointAssets assets={assets} selectedElements={assets} />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(2);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[0].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[1].properties.selected).toBe(true);

    rerender(<PointAssets assets={[]} selectedElements={assets} />);
    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    expect(spyOnGeneratePointAssetFeatures).toHaveReturnedWith([]);
  });

  test("should generate selected point asset features for selected assets which exist", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
    const assets = await getCreatedAssets(
      [
        ...HIGH_VOLTAGE_ELECTRICITY_SUBSTATION_COMPLEX_ASSETS,
        ...OIL_FIRED_POWER_GENERATION_COMPLEX_ASSETS,
      ],
      ["E001", "E025", "E003"]
    );
    const { rerender } = renderWithQueryClient(
      <PointAssets assets={assets} selectedElements={assets} />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value).toHaveLength(3);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[0].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[1].properties.selected).toBe(true);
    expect(spyOnGeneratePointAssetFeatures.mock.results[0].value[2].properties.selected).toBe(true);

    const filteredAssets = assets.filter((asset) => {
      const typeFilter = "http://ies.data.gov.uk/ontology/ies4#OilFiredPowerGenerationComplex";
      const isOilFiredAsset = asset.type === typeFilter;
      return isOilFiredAsset;
    });
    rerender(<PointAssets assets={filteredAssets} selectedElements={assets} />);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    expect(spyOnGeneratePointAssetFeatures.mock.results[1].value).toHaveLength(1);
    expect(spyOnGeneratePointAssetFeatures.mock.results[1].value[0].properties.selected).toBe(true);
  });

  test("should NOT generate dependency features when previously dependencies when assets are removed", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    const { rerender } = renderWithQueryClient(
      <PointAssets assets={assets} dependencies={dependencies} selectedElements={dependencies} />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    const results =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getLineStringFeatures);
    expect(results).toHaveLength(1);
    expect(results[0].properties.selected).toBe(true);

    rerender(<PointAssets assets={[]} dependencies={[]} selectedElements={dependencies} />);
    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    expect(spyOnGeneratePointAssetFeatures).toHaveReturnedWith([]);
  });

  test("should generate selected dependency features for assets which exist", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    const { rerender } = renderWithQueryClient(
      <PointAssets assets={assets} dependencies={dependencies} selectedElements={dependencies} />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    let results =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getLineStringFeatures);
    expect(results).toHaveLength(2);
    expect(results[0].properties.selected).toBe(true);
    expect(results[1].properties.selected).toBe(true);

    const filteredAssets = assets.filter((asset) => {
      const typeFilter =
        "http://ies.data.gov.uk/ontology/ies4#HighVoltageElectricitySubstationComplex";
      const isHighVoltageAsset = asset.type === typeFilter;
      return isHighVoltageAsset;
    });

    rerender(
      <PointAssets
        assets={filteredAssets}
        dependencies={dependencies}
        selectedElements={dependencies}
      />
    );
    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    results = spyOnGeneratePointAssetFeatures.mock.results[1].value.filter(getLineStringFeatures);
    expect(results).toHaveLength(1);
    expect(results[0].properties.selected).toBe(true);
  });

  test("should NOT generate point asset and dependency features when previoulsy selected elements are removed", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    const { rerender } = renderWithQueryClient(
      <PointAssets
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);
    const assetFeatures =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getPointFeatures);
    const dependenciesFeatures =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getLineStringFeatures);
    // Point assets
    expect(assetFeatures).toHaveLength(2);
    expect(assetFeatures[0].properties.selected).toBe(true);
    expect(assetFeatures[1].properties.selected).toBe(true);

    // Point asset dependencies
    expect(dependenciesFeatures).toHaveLength(1);
    expect(dependenciesFeatures[0].properties.selected).toBe(true);

    rerender(
      <PointAssets assets={[]} dependencies={[]} selectedElements={[...assets, ...dependencies]} />
    );
    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    expect(spyOnGeneratePointAssetFeatures).toHaveReturnedWith([]);
  });

  test("should generate selected point asset and dependency features for elements which exist", async () => {
    const spyOnGeneratePointAssetFeatures = jest.spyOn(mapUtils, "generatePointAssetFeatures");
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
    const { rerender } = renderWithQueryClient(
      <PointAssets
        assets={assets}
        dependencies={dependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    let assetFeatures =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getPointFeatures);
    let dependenciesFeatures =
      spyOnGeneratePointAssetFeatures.mock.results[0].value.filter(getLineStringFeatures);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(1);

    // Point assets
    expect(assetFeatures).toHaveLength(3);
    expect(assetFeatures[0].properties.selected).toBe(true);
    expect(assetFeatures[1].properties.selected).toBe(true);
    expect(assetFeatures[2].properties.selected).toBe(true);

    // Point asset dependencies
    expect(dependenciesFeatures).toHaveLength(2);
    expect(dependenciesFeatures[0].properties.selected).toBe(true);
    expect(dependenciesFeatures[1].properties.selected).toBe(true);

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
      <PointAssets
        assets={filteredAssets}
        dependencies={filteredDependencies}
        selectedElements={[...assets, ...dependencies]}
      />
    );

    assetFeatures = spyOnGeneratePointAssetFeatures.mock.results[1].value.filter(getPointFeatures);
    dependenciesFeatures =
      spyOnGeneratePointAssetFeatures.mock.results[1].value.filter(getLineStringFeatures);

    expect(spyOnGeneratePointAssetFeatures).toBeCalledTimes(2);
    // Point assets
    expect(assetFeatures).toHaveLength(2);
    expect(assetFeatures[0].properties.selected).toBe(true);
    expect(assetFeatures[1].properties.selected).toBe(true);
    // Point asset dependencies
    expect(dependenciesFeatures).toHaveLength(1);
    expect(dependenciesFeatures[0].properties.selected).toBe(true);
  });
});
