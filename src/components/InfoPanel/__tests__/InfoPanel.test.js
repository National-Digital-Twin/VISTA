import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import InfoPanel from "../InfoPanel";
import { ElementsContext } from "../../../context";

const singleElementSelected = [
  {
    uri: "http://telicent.io/fake_data#E007",
    title: "Newport 33kV / 11kV Substation (E007)",
    criticality: 5,
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    lat: 50.70349697318166,
    lng: -1.2920374015325664,
    color: "#6dbd29",
    connectedAssets: [
      {
        uri: "http://telicent.io/fake_data#E027",
        title: "Gas Regulator Station (E027)",
        assetCriticality: 2,
        cxnCriticality: 2,
        color: "#4bbe30",
      },
      {
        uri: "http://telicent.io/fake_data#E004",
        title: "Wooton Common 132/33kV Substation (E004)",
        assetCriticality: 36,
        cxnCriticality: 3,
        color: "#fb3737",
      },
    ],
    elementType: "asset",
  },
];

const multipleSelected = [
  {
    uri: "http://telicent.io/fake_data#E007",
    title: "Newport 33kV / 11kV Substation (E007)",
    criticality: 5,
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    lat: 50.70349697318166,
    lng: -1.2920374015325664,
    color: "#6dbd29",
    connectedAssets: [
      {
        uri: "http://telicent.io/fake_data#E027",
        title: "Gas Regulator Station (E027)",
        assetCriticality: 2,
        cxnCriticality: 2,
        color: "#4bbe30",
      },
      {
        uri: "http://telicent.io/fake_data#E004",
        title: "Wooton Common 132/33kV Substation (E004)",
        assetCriticality: 36,
        cxnCriticality: 3,
        color: "#fb3737",
      },
    ],
    elementType: "asset",
  },
  {
    uri: "http://telicent.io/fake_data#E024",
    title: "Homestead Solar Farm (E024)",
    criticality: 0,
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    description:
      "The community owned 3.95MW ground mounted solar PV system was built by Anesco and was commissioned on 18th December 2015.",
    lat: 50.693064683078795,
    lng: -1.4261251297288462,
    color: "#35c035",
    connectedAssets: [],
    elementType: "asset",
  },
  {
    uri: "http://telicent.io/fake_data#E025",
    title: "Fawley 132 kV Substation - Hants (E025)",
    criticality: 0,
    type: "http://ies.data.gov.uk/ontology/ies4#Facility",
    lat: 50.817708523423846,
    lng: -1.3292121455131856,
    color: "#35c035",
    connectedAssets: [],
    elementType: "asset",
  },
];

function setup(data) {
  const selectedDetails = data;
  return {
    user: userEvent.setup(),
    ...render(
      <ElementsContext.Provider value={{ selectedDetails }}>
        <InfoPanel />
      </ElementsContext.Provider>
    ),
  };
}

describe("InfoPanel Component", () => {
  test("renders message when no elements are selected and the panel is open", async () => {
    const { user } = setup([]);

    await user.click(screen.getByRole("button", { name: "open details panel" }));

    expect(screen.getByText(/click on an asset or connection to view details/i)).toBeInTheDocument();
  });

  test("toggles info panel on and off", async () => {
    const { user } = setup([]);

    await user.click(screen.getByRole("button", { name: "open details panel" }));
    expect(screen.getByText(/click on an asset or connection to view details/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close details panel" }));
    expect(screen.queryByText(/click on an asset or connection to view details/i)).not.toBeInTheDocument();
  });

  test("render selected badge number", () => {
    setup(singleElementSelected);

    const selectedBadge = screen.getByTestId("selected-badge");

    expect(selectedBadge).toHaveTextContent("1");
  });

  test("render the selected elements list", async () => {
    const { user } = setup(multipleSelected);
    await user.click(screen.getByRole("button", { name: "open details panel" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Newport 33kV / 11kV Substation (E007)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Homestead Solar Farm (E024)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fawley 132 kV Substation - Hants (E025)" })).toBeInTheDocument();
  });

  test("render the list of selected elements when back button is clicked", async () => {
    const { user } = setup(multipleSelected);
    await user.click(screen.getByRole("button", { name: "open details panel" }));

    await user.click(screen.getByRole("button", { name: "Newport 33kV / 11kV Substation (E007) ies:Facility" }));
    await user.click(screen.getByRole("button", { name: "view all selected" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  test("render assets details when only one element is selected", async () => {
    const { user } = setup(singleElementSelected);
    await user.click(screen.getByRole("button", { name: "open details panel" }));

    expect(screen.getByRole("heading", { name: "Newport 33kV / 11kV Substation (E007)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 Connected Assets" })).toBeInTheDocument();
  });

  test("Render connected Assets on and off when toggle", async () => {
    const { user } = setup(singleElementSelected);

    await user.click(screen.getByRole("button", { name: "open details panel" }));

    expect(screen.getByRole("heading", { level: 4, name: "Gas Regulator Station (E027)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2 Connected Assets" }));

    expect(screen.queryByRole("heading", { level: 4, name: "Gas Regulator Station (E027)" })).not.toBeInTheDocument();
  });

  test("render street view button with correct link", async () => {
    const { user } = setup(singleElementSelected);
    await user.click(screen.getByRole("button", { name: "open details panel" }));

    expect(screen.getByRole("link", { name: /street view/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=50.70349697318166%2C-1.2920374015325664"
    );
  });
});
