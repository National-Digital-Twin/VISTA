import { screen, render, waitFor } from "@testing-library/react";
import { rest } from "msw";

import {
  ASSESSMENTS_ASSETS_ENDPOINT,
  ASSESSMENTS_DEPENDENCIES_ENDPOINT,
} from "constants/endpoints";
import server, { ASSESSMENTS } from "mocks";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { ErrorNotification } from "lib";
import { PanelProviders } from "test-utils";

import GroupedTypes from "../GroupedTypes";
import * as datasetUtils from "../dataset-utils";

const waitForDataToLoad = async () => {
  const spyOnCreateAssets = jest.spyOn(datasetUtils, "createAssets");
  const spyOnCreateDependencies = jest.spyOn(datasetUtils, "createDependencies");

  await waitFor(() => {
    expect(spyOnCreateAssets).toHaveReturned();
    expect(spyOnCreateDependencies).toHaveReturned();
  })
};

const renderGroupedTypes = ({ types, selectedTypes }) => {
  const modalRoot = document.createElement("div");
  modalRoot.setAttribute("id", "root");
  document.body.appendChild(modalRoot);

  render(
    <>
      <ErrorNotification />
      <GroupedTypes
        expand
        assessment={ASSESSMENTS[0].uri}
        types={types}
        selectedTypes={selectedTypes}
        setSelectedTypes={jest.fn()}
        setIsGeneratingData={jest.fn()}
      />
    </>,
    { wrapper: PanelProviders, container: document.body.appendChild(modalRoot) }
  );
};

describe("GroupedTypes component", () => {
  test("renders error message when assessments/assets api call fails", async () => {
    server.use(rest.get(ASSESSMENTS_ASSETS_ENDPOINT, mockError));
    renderGroupedTypes({
      types: [
        {
          uri: "http://ies.data.gov.uk/ontology/ies4#Tunnel",
          assetCount: 2,
          subClassOf: null,
          superClass: "other",
        },
      ],
      selectedTypes: ["http://ies.data.gov.uk/ontology/ies4#Tunnel"],
    });

    await waitForDataToLoad();
    expect(screen.getByRole("checkbox", { name: "tunnel [2]" })).toBeChecked();
    expect(
      screen.getByText("Could not add data. Reason: Failed to resolve the data")
    ).toBeInTheDocument();
  });

  test("renders error message when assessments/dependencies api call fails", async () => {
    server.use(rest.get(ASSESSMENTS_DEPENDENCIES_ENDPOINT, mockError));
    renderGroupedTypes({
      types: [
        {
          uri: "http://ies.data.gov.uk/ontology/ies4#Tunnel",
          assetCount: 2,
          subClassOf: null,
          superClass: "other",
        },
      ],
      selectedTypes: ["http://ies.data.gov.uk/ontology/ies4#Tunnel"],
    });

    await waitForDataToLoad();
    expect(screen.getByRole("checkbox", { name: "tunnel [2]" })).toBeChecked();
    expect(
      screen.getByText("Could not add data. Reason: Failed to resolve the data")
    ).toBeInTheDocument();
  });

  test.skip("renders error message when assets/:id/parts api call fails", async () => {
 
    server.use(rest.get("/assets/:id/parts", mockError));
    renderGroupedTypes({
      types: [
        {
          uri: "http://ies.data.gov.uk/ontology/ies4#Tunnel",
          assetCount: 2,
          subClassOf: null,
          superClass: "other",
        },
      ],
      selectedTypes: ["http://ies.data.gov.uk/ontology/ies4#Tunnel"],
    });

    await waitForDataToLoad();
    expect(screen.getByRole("checkbox", { name: "tunnel [2]" })).toBeChecked();
    expect(
      screen.getByText("Could not add data. Reason: Failed to resolve the data")
    ).toBeInTheDocument();
  });
});
