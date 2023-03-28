import { render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider as UseHttpProvider } from "use-http";
import { MapProvider } from "react-map-gl";
import { QueryClient, QueryClientProvider } from "react-query";

import { Dataset } from "./components";
import { CytoscapeProvider, ElementsContext, ElementsProvider } from "./context";
import { createAssets, createDependencies } from "components/Dataset/dataset-utils";

const user = userEvent.setup();

export const clickLowVoltageElectricity = async () => {
  await user.click(screen.getByRole("button", { name: /Electrical power distribution complex/i }));
  await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
  expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
};

export const clickEnergyDataset = async () => {
  await user.click(await screen.findByRole("checkbox", { name: "Energy [25]" }));
  expect(screen.getByRole("checkbox", { name: "Energy [25]" })).toBeChecked();
};

export const clickTransportDataset = async () => {
  await user.click(await screen.findByRole("checkbox", { name: "Transport [44]" }));
};

export const clickMedicalDataset = async () => {
  await user.click(await screen.findByRole("checkbox", { name: "Medical [32]" }));
};

export const expandPanel = async (panelName) =>
  await user.click(screen.getByRole("button", { name: panelName }));

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

export const PanelProviders = ({ children, elementsProviderValue }) => (
  <UseHttpProvider options={{ cacheLife: 0, cachePolicy: "no-cache" }}>
    <ElementsProvider value={elementsProviderValue}>{children}</ElementsProvider>
  </UseHttpProvider>
);

const LoadDataWrapper = ({ testComponent, children }) => (
  <MapProvider>
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
  </MapProvider>
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

const createTestQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return queryClient;
};
export const createQueryClientWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export const renderWithQueryClient = (ui, options) => {
  const queryClient = createTestQueryClient();

  // https://github.com/testing-library/react-testing-library/issues/218#issuecomment-436730757
  const rendered = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    options
  );

  return {
    user,
    ...rendered,
    rerender: (ui, options) =>
      renderWithQueryClient(ui, { container: rendered.container, ...options }),
  };
};

export const setup = (ui) => {
  return {
    user,
    ...render(ui),
  };
};

export const getCreatedAssets = async (
  assets,
  ids,
  getIconStyle = jest.fn(),
  getAssetGeometry = jest.fn()
) => {
  const createdAssets = (await createAssets(assets, getIconStyle, getAssetGeometry)).filter(
    (asset) => ids.includes(asset.id)
  );
  return createdAssets;
};

export const getCreatedDependencies = (dependencies, ids) => {
  const createdDependencies = createDependencies(dependencies).filter((asset) =>
    ids.includes(asset.id)
  );
  return createdDependencies;
};
