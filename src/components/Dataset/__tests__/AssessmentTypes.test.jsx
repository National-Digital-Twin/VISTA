import { rest } from "msw";
import { render, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import server, { ASSESSMENTS } from "mocks";
import { ASSESSMENTS_ASSET_TYPES_ENDPOINT, ONTOLOGY_CLASS_ENDPOINT } from "constants/endpoints";
import { mockEmptyResponse, mockError } from "mocks/resolvers";
import { PanelProviders } from "test-utils";

import AssessmentTypes from "../AssessmentTypes";

const user = userEvent.setup();

const renderAssessmentTypes = () => {
  render(
    <AssessmentTypes
      assessment={ASSESSMENTS[0].uri}
      selectedTypes={[]}
      setSelectedTypes={jest.fn()}
    />,
    { wrapper: PanelProviders }
  );
};

const waitForDataToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText(/fetching data types/i));
};

describe("AssessmentTypes component", () => {
  test("renders grouped types", async () => {
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(
      screen.getByRole("treeitem", { name: "Electrical power distribution complex" })
    ).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Facility" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Wastewater complex" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Other" })).toBeInTheDocument();
  });

  test("renders electrical power distribution complex types with total count", async () => {
    renderAssessmentTypes();
    await waitForDataToLoad();

    await user.click(screen.getByRole("button", { name: "Electrical power distribution complex" }));
    const electicalPowerDistributionComplexListItems = within(
      screen.getByRole("treeitem", {
        name: /Electrical power distribution complex/i,
        expanded: true,
      })
    ).getAllByRole("listitem");

    expect(
      within(electicalPowerDistributionComplexListItems[0]).getByLabelText(
        /high voltage electricity substation complex \[8\]/i
      )
    ).toBeInTheDocument();
    expect(
      within(electicalPowerDistributionComplexListItems[1]).getByLabelText(
        /low voltage electricity substation complex \[9\]/i
      )
    ).toBeInTheDocument();
  });

  test("renders other types with total count", async () => {
    renderAssessmentTypes();
    await waitForDataToLoad();

    await user.click(screen.getByRole("button", { name: "Other" }));
    const electicalPowerDistributionComplexListItems = within(
      screen.getByRole("treeitem", {
        name: /other/i,
        expanded: true,
      })
    ).getAllByRole("listitem");

    expect(
      within(electicalPowerDistributionComplexListItems[0]).getByLabelText(
        /tunnel \[2\]/i
      )
    ).toBeInTheDocument();
    expect(
      within(electicalPowerDistributionComplexListItems[1]).getByLabelText(
        /underpass \[2\]/i
      )
    ).toBeInTheDocument();
  });

  test("renders message when asset types are not found", async () => {
    server.use(rest.get(ASSESSMENTS_ASSET_TYPES_ENDPOINT, mockEmptyResponse));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(await screen.findByText("Dataset types not found")).toBeInTheDocument();
  });

  test("renders error message when /assessments/asset-types api call fails", async () => {
    server.use(rest.get(ASSESSMENTS_ASSET_TYPES_ENDPOINT, mockError));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(
      screen.getByText(
        "An error occured while retrieving data types. Please try again. If problem persists contact admin"
      )
    ).toBeInTheDocument();
  });

  test("renders error message when /ontology/class api call fails", async () => {
    server.use(rest.get(ONTOLOGY_CLASS_ENDPOINT, mockError));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(
      screen.getByText(
        "An error occured while retrieving data types. Please try again. If problem persists contact admin"
      )
    ).toBeInTheDocument();
  });
});
