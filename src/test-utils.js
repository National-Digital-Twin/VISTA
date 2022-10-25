import { render } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { Categories } from "./components";
import { CytoscapeProvider, ElementsContext, ElementsProvider } from "./context";

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

export const LoadDataWrapper = ({ testComponent, children }) => (
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
              <Categories />
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
