import type { ReactNode } from "react";
import { capitalCase } from "change-case";
import { Asset, Dependency } from "@/models";

export interface TableColumn<T> {
  /** Exported name of the column */
  name: string;
  /** Human-readable name of the column */
  title: string;
  /** Formatter of the column (string value) */
  format: (element: T) => string;
  /** Formatter of the column (display value, if required) */
  display?: (element: T) => ReactNode;
}

export class Table<T> {
  columns: TableColumn<T>[];

  constructor() {
    this.columns = [];
  }

  addColumn(column: TableColumn<T>) {
    this.columns.push(column);
  }

  plainHeaders() {
    return this.columns.map((column) => column.name);
  }

  titles() {
    return this.columns.map((column) => column.title);
  }

  formatText(element: T) {
    return this.columns.map((column) => column.format(element));
  }

  formatNodes(element: T) {
    return this.columns.map((column) =>
      column.display ? column.display(element) : column.format(element),
    );
  }

  prepareExport(elements: T[], withHeader: boolean) {
    const rows: string[][] = [];
    if (withHeader) {
      rows.push(this.plainHeaders());
    }
    elements.forEach((element) => {
      rows.push(this.formatText(element));
    });
    return rows;
  }
}

export const ASSET_TABLE = new Table<Asset>();
ASSET_TABLE.addColumn({
  name: "id",
  title: "Asset ID",
  format: (asset) => asset.id,
});
ASSET_TABLE.addColumn({
  name: "type",
  title: "Type",
  format: (asset) => {
    const typeURI = asset.type;
    return typeURI.split("#")[1];
  },
  display: (asset) => {
    const typeURI = asset.type;
    const typeName = typeURI.split("#")[1];
    return capitalCase(typeName);
  },
});
ASSET_TABLE.addColumn({
  name: "lat",
  title: "Latitude",
  format: (asset) => (asset.lat ? asset.lat.toString() : "N/A"),
});
ASSET_TABLE.addColumn({
  name: "lng",
  title: "Longitude",
  format: (asset) => (asset.lng ? asset.lng.toString() : "N/A"),
});
ASSET_TABLE.addColumn({
  name: "dependent",
  title: "Dependent",
  format: (asset) =>
    `Count: ${asset.dependent.count}, Criticality Sum: ${asset.dependent.criticalitySum}`,
});
ASSET_TABLE.addColumn({
  name: "primaryCategory",
  title: "Primary Category",
  format: (asset) => asset.primaryCategory || "none",
});
ASSET_TABLE.addColumn({
  name: "secondaryCategory",
  title: "Secondary Category",
  format: (asset) => asset.secondaryCategory || "none",
});

export const DEPENDENCY_TABLE = new Table<Dependency>();
DEPENDENCY_TABLE.addColumn({
  name: "id",
  title: "ID",
  format: (dependency) => dependency.id,
});
DEPENDENCY_TABLE.addColumn({
  name: "provider",
  title: "Provider",
  format: (dependency) => dependency.provider.name,
});
DEPENDENCY_TABLE.addColumn({
  name: "dependent",
  title: "Dependent",
  format: (dependency) => dependency.dependent.name,
});
DEPENDENCY_TABLE.addColumn({
  name: "criticality",
  title: "Criticality",
  format: (dependency) => dependency.criticality.toString(),
});
