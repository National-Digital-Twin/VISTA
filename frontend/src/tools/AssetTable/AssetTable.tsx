import { useContext, useCallback, useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TablePagination,
} from "@mui/material";
import { faFileExcel, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { download } from "./utils";
import { ASSET_TABLE } from "./format-assets";
import styles from "./AssetTable.module.css";
import { ElementsContext } from "@/context/ElementContext";

export default function AssetTable() {
  const { assets, dependencies } = useContext(ElementsContext);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const downloadCSV = useCallback(() => {
    download(assets, dependencies, "csv");
  }, [assets, dependencies]);

  const downloadXLSX = useCallback(() => {
    download(assets, dependencies, "xlsx");
  }, [assets, dependencies]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Slice the assets array based on the current page
  const displayedAssets = assets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <div className={styles.assetTableHeader}>
        <h3 className="text-lg font-semibold">Asset Table</h3>
        {assets.length > 0 && (
          <div className={styles.exportButtons}>
            <button className="btn btn-primary" onClick={downloadCSV}>
              <FontAwesomeIcon icon={faFileCsv} className="mr-2" />
              CSV
            </button>
            <button className="btn btn-success" onClick={downloadXLSX}>
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
              XLSX
            </button>
          </div>
        )}
      </div>

      <TableContainer component={Paper} className={styles.assetTableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              {ASSET_TABLE.columns.map((column) => (
                <TableCell key={column.name}>{column.title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedAssets.length > 0 ? (
              displayedAssets.map((asset, index) => (
                <TableRow key={asset.id || index}>
                  {ASSET_TABLE.columns.map((column) => {
                    const cellValue = column.display
                      ? column.display(asset)
                      : column.format(asset);
                    return <TableCell key={column.name}>{cellValue}</TableCell>;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={ASSET_TABLE.columns.length} align="center">
                  No assets are displayed; try selecting asset layers or a flood
                  polygon.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div style={{ minHeight: "50px" }}>
          <TablePagination
            component="div"
            count={assets.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </div>
      </TableContainer>
    </>
  );
}
