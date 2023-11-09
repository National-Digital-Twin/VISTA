import { rest } from "msw";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";

import { ElementsProvider } from "context";
import server, { ASSESSMENTS } from "mocks";
import { mockEmptyResponse, mock400Error } from "mocks/resolvers";
import { renderWithQueryClient } from "test-utils";

import AssessmentTypes from "../AssessmentTypes";
import { createParalogEndpoint } from "api/utils";

const assessmentTypesURL = createParalogEndpoint("assessments/asset-types");

const renderAssessmentTypes = () =>
  renderWithQueryClient(
    <AssessmentTypes
      assessment={ASSESSMENTS[0].uri}
      selectedTypes={[]}
      setSelectedTypes={jest.fn()}
    />,
    { wrapper: ElementsProvider }
  );

const waitForDataToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryByText(/fetching data types/i));
};

describe("AssessmentTypes component", () => {
  test("renders grouped types", async () => {
    server.use(rest.get(assessmentTypesURL, mockEmptyResponse));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(
      screen.getByRole("button", { name: /Electrical power distribution complex/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Facility/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wastewater complex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Other/i })).toBeInTheDocument();
  });

  test("renders electrical power distribution complex types with total count", async () => {
    server.use(rest.get(assessmentTypesURL, mockEmptyResponse));
    const { user } = renderAssessmentTypes();
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
    server.use(rest.get(assessmentTypesURL, mockEmptyResponse));
    const { user } = renderAssessmentTypes();
    await waitForDataToLoad();

    await user.click(screen.getByRole("button", { name: "Other" }));
    const otherListItems = within(
      screen.getByRole("treeitem", {
        name: /other/i,
        expanded: true,
      })
    ).getAllByRole("listitem");

    expect(within(otherListItems[0]).getByLabelText(/tunnel \[2\]/i)).toBeInTheDocument();
    expect(within(otherListItems[1]).getByLabelText(/underpass \[2\]/i)).toBeInTheDocument();
  });

  test("adds type to other when super class endpoint errors", async () => {
    server.use(
      rest.get(createParalogEndpoint("ontology/class"), (req, res, ctx) => {
        const classUri = req.url.searchParams.get("classUri");
        if (
          classUri === "http://ies.data.gov.uk/ontology/ies4#LowVoltageElectricitySubstationComplex"
        ) {
          return res.once(ctx.status(404), ctx.json("Not found"));
        }
      })
    );
    server.use(rest.get(assessmentTypesURL, mockEmptyResponse));
    const { user } = renderAssessmentTypes();
    await waitForDataToLoad();

    await user.click(screen.getByRole("button", { name: "Other" }));
    const otherListItems = within(
      screen.getByRole("treeitem", {
        name: /other/i,
        expanded: true,
      })
    ).getAllByRole("listitem");

    expect(otherListItems).toHaveLength(3);
    expect(
      within(otherListItems[0]).getByLabelText(/low voltage electricity substation complex \[9\]/i)
    ).toBeInTheDocument();
  });

  test("renders message when asset types are not found", async () => {
    server.use(rest.get(assessmentTypesURL, mockEmptyResponse));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(await screen.findByText("Dataset types not found")).toBeInTheDocument();
  });

  test("renders error message when /assessments/asset-types api call fails", async () => {
    server.use(rest.get(assessmentTypesURL, mock400Error));
    renderAssessmentTypes();
    await waitForDataToLoad();

    expect(
      screen.getByText(
        "An error occured while retrieving data types for https://www.iow.gov.uk/DigitalTwin#iowAssessment"
      )
    ).toBeInTheDocument();
  });
});
