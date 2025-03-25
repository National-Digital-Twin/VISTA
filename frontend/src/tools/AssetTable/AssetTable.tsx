import { useContext, useCallback, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Typography,
  Button,
  SvgIcon,
} from "@mui/material";
import { useMediaQuery } from "usehooks-ts";
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

  const smallScreen = useMediaQuery("(max-height: 767px)");

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        padding: "1em",
        zIndex: "1000",
        maxHeight: "59vh",
        maxWidth: "61vw",
        position: "absolute",
        right: "0",
      }}
      width={assets.length > 0 ? "initial" : "21em"}
      top={assets.length > 0 ? "0" : "initial"}
      marginTop={assets.length > 0 ? "2vh" : "initial"}
      marginRight={smallScreen ? "10vh" : "9vh"}
      component={Paper}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5em",
        }}
      >
        <Typography variant="h6">Asset Table</Typography>
        {assets.length > 0 && (
          <div className={styles.exportButtons}>
            <Button
              variant="contained"
              color="primary"
              sx={{ paddingLeft: "2.5em", paddingRight: "2.5em" }}
              onClick={downloadCSV}
            >
              <SvgIcon>
                <svg
                  width="21"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4997 12.4997V14.9997H5.49967V12.4997H3.83301V14.9997C3.83301 15.9163 4.58301 16.6663 5.49967 16.6663H15.4997C16.4163 16.6663 17.1663 15.9163 17.1663 14.9997V12.4997H15.4997ZM14.6663 9.16634L13.4913 7.99134L11.333 10.1413V3.33301H9.66634V10.1413L7.50801 7.99134L6.33301 9.16634L10.4997 13.333L14.6663 9.16634Z"
                    fill="white"
                  />
                </svg>
              </SvgIcon>
              CSV
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={downloadXLSX}
              sx={{ paddingLeft: "2.5em", paddingRight: "2.5em" }}
            >
              <SvgIcon>
                <svg
                  width="21"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4997 12.4997V14.9997H5.49967V12.4997H3.83301V14.9997C3.83301 15.9163 4.58301 16.6663 5.49967 16.6663H15.4997C16.4163 16.6663 17.1663 15.9163 17.1663 14.9997V12.4997H15.4997ZM14.6663 9.16634L13.4913 7.99134L11.333 10.1413V3.33301H9.66634V10.1413L7.50801 7.99134L6.33301 9.16634L10.4997 13.333L14.6663 9.16634Z"
                    fill="white"
                  />
                </svg>
              </SvgIcon>
              XLSX
            </Button>
          </div>
        )}
      </Box>
      {displayedAssets.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {ASSET_TABLE.columns.map((column) => (
                  <TableCell key={column.name}>{column.title}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedAssets.map((asset, index) => (
                <TableRow key={asset.id || index} sx={{ lineHeight: "0" }}>
                  {ASSET_TABLE.columns.map((column) => {
                    const cellValue = column.display
                      ? column.display(asset)
                      : column.format(asset);
                    return <TableCell key={column.name}>{cellValue}</TableCell>;
                  })}
                </TableRow>
              ))}
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
      ) : (
        <Typography sx={{ paddingLeft: "auto", paddingRight: "auto" }}>
          No assets are displayed; try selecting asset layers or a flood
          polygon.
        </Typography>
      )}
    </Box>
  );
}
