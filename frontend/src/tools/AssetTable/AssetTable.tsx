import { useContext, useCallback } from "react";
import { faFileExcel, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { download } from "./utils";
import ElementTable from "./ElementTable";
import { ASSET_TABLE } from "./format-assets";
import styles from "./AssetTable.module.css";
import { ElementsContext } from "@/context/ElementContext";

export default function AssetTable() {
  const { assets, dependencies } = useContext(ElementsContext);

  const downloadCSV = useCallback(() => {
    download(assets, dependencies, "csv");
  }, [assets, dependencies]);
  const downloadXLSX = useCallback(() => {
    download(assets, dependencies, "xlsx");
  }, [assets, dependencies]);

  return (
    <>
      <div className={styles.assetTableHeader}>
        <h3 className="text-lg font-semibold">Asset Table</h3>
        {assets.length > 0 && (
          <>
            <button className="btn btn-primary" onClick={downloadCSV}>
              <FontAwesomeIcon icon={faFileCsv} className="mr-2" />
              CSV
            </button>
            <button className="btn btn-success" onClick={downloadXLSX}>
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
              XLSX
            </button>
          </>
        )}
      </div>
      <ElementTable
        table={ASSET_TABLE}
        elements={assets}
        elementsPerPage={15}
        fallback="No assets are displayed; try selecting asset layers or a flood polygon."
      />
    </>
  );
}
