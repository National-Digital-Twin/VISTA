import { utils, writeFile } from "xlsx-republish";
import { ASSET_TABLE, DEPENDENCY_TABLE } from "./format-assets";
import type { Asset, Dependency } from "@/models";

function escapeCSVInner(value: string) {
  return value.replace(/([",\\])/gi, "\\$1");
}

function escapeCSVCell(value: string) {
  return `"${escapeCSVInner(value)}"`;
}

function formatCSVCell(value: string) {
  const regex = /[",\\]/;
  return regex.exec(value) ? escapeCSVCell(value) : value;
}

function formatCSVRow(row: string[]) {
  return row.map(formatCSVCell).join(",");
}

function convertToCSV(data: string[][]) {
  return data.map(formatCSVRow).join("\r\n") + "\r\n";
}

function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function download(
  assets: Asset[],
  dependencies: Dependency[],
  format: "csv" | "xlsx",
) {
  const assetsTable = ASSET_TABLE.prepareExport(assets, true);
  const dependenciesTable = DEPENDENCY_TABLE.prepareExport(dependencies, true);

  if (format === "csv") {
    downloadCSV(convertToCSV(assetsTable), "assets.csv");
    downloadCSV(convertToCSV(dependenciesTable), "dependencies.csv");
  } else {
    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.aoa_to_sheet(assetsTable), "Assets");
    utils.book_append_sheet(
      wb,
      utils.aoa_to_sheet(dependenciesTable),
      "Dependencies",
    );
    writeFile(wb, "asset_data.xlsx");
  }
}
