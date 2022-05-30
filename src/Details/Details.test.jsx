import { render, screen } from "@testing-library/react";
import Details from ".";

const clickMsg = /click on an asset or connections to view details/i;

const elementConnection = {
  category: "connection",
  label: "elementLabel",
  criticality: 1,
  scoreColour: "red",
  target: {
    name: "element-target-name",
  },
  desc: "element-description",
  name: "element-name",
};

const assetConnection = {
  category: "asset",
  label: "elementLabel",
  criticality: 1,
  scoreColour: "red",
  target: {
    name: "element-target-name",
  },
  desc: "element-description",
  name: "element-name",
};

describe("Details", () => {
  describe("no elements", () => {
    beforeEach(() => {
      render(<Details type="asset" />);
    });

    it("should show empty spans if no element is selected", () => {
      expect(
        screen.queryByRole("heading", { level: 2 })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 5 })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(clickMsg)).not.toBeInTheDocument();
    });
  });

  describe("connection - ", () => {
    beforeEach(() => {
      render(<Details element={elementConnection} type="asset" />);
    });

    it("should show element information", () => {
      expect(
        screen.getByRole("heading", { name: /elementLabel/ })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 5 })).toHaveTextContent(
        /element-name/i
      );
      expect(screen.queryByText(clickMsg)).not.toBeInTheDocument();
    });
  });

  describe("assets - ", () => {
    beforeEach(() => {
      render(<Details element={assetConnection} type="asset" />);
    });

    it("should show element information", () => {
      expect(
        screen.queryByRole("heading", { name: /elementLabel/ })
      ).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 5 })).toHaveTextContent(
        /element-name/i
      );
      expect(screen.queryByText(clickMsg)).not.toBeInTheDocument();
    });
  });
});
