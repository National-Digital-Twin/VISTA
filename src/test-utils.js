import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { Dataset } from "./components";
import { CytoscapeProvider, ElementsContext, ElementsProvider } from "./context";
import * as utils from "./components/Dataset/utils";

const clickEnergyDataset = async (user) => {
  await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
}

export const AssetBtn = ({ label, assets, event, onElementClick }) => (
  <button
    onClick={() => {
      onElementClick(
        event,
        assets.find((asset) => asset.label === label)
      );
    }}
  >
    {label}
  </button>
);

export const CxnBtn = ({ label, connections, event, onElementClick }) => (
  <button
    onClick={() => {
      onElementClick(
        event,
        connections.find((cxn) => cxn.label === label)
      );
    }}
  >
    {label}
  </button>
);

const LoadDataWrapper = ({ testComponent, children }) => (
  <CytoscapeProvider>
    <ElementsProvider>
      <ElementsContext.Consumer>
        {({ assets, connections, selectedElements, onElementClick }) => {
          return (
            <>
              {testComponent && testComponent({ assets, connections, onElementClick })}
              <div id="all-assets">
                {assets.map((asset) => (
                  <p id="asset" key={asset.id}>
                    {asset.id}
                  </p>
                ))}
              </div>
              <div id="all-connections">
                {connections.map((cxn) => (
                  <p id="cxn" key={cxn.id}>
                    {cxn.id}
                  </p>
                ))}
              </div>
              <div id="selected-elements">
                {selectedElements.map((selectedElement) => (
                  <p id="selected-element" key={selectedElement.id}>
                    {selectedElement.id}
                  </p>
                ))}
              </div>
              <Dataset />
              {children}
            </>
          );
        }}
      </ElementsContext.Consumer>
    </ElementsProvider>
  </CytoscapeProvider>
);

export const renderTestComponent = (ui, options) => {
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <LoadDataWrapper testComponent={options?.testComponent}>{children}</LoadDataWrapper>
      ),
      ...options?.testingLibraryOptions,
    }),
  };
};

export const selectDatasets = async (user, datasets) => {
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
