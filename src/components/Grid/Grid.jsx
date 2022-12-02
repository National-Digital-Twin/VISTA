import React, { useContext, useState } from "react";
import { isEmpty } from "lodash";

import { ElementsContext } from "context";
import GridToolbar from "./GridToolbar";
import "./Grid.css";

const HEADINGS_COL_SPAN = 3;
const generateCarverMatrix = (assets, dependencies) => {
  const ROWS = assets.length;
  const COLS = ROWS + HEADINGS_COL_SPAN;
  let grid = new Array(ROWS);
  let headings = new Array(0);

  console.log(assets, dependencies);

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    grid[rowIndex] = [];
    headings[rowIndex] = assets[rowIndex].id;

    for (let colIndex = HEADINGS_COL_SPAN; colIndex < COLS; colIndex++) {
      const asset = assets[rowIndex];
      grid[rowIndex][0] = asset.id;
      grid[rowIndex][1] = asset.dependent.count;
      grid[rowIndex][2] = asset.dependent.criticalitySum;
      // grid[rowIndex][3] = asset.name;

      if (rowIndex === colIndex - HEADINGS_COL_SPAN) {
        grid[rowIndex][colIndex] = { color: "#4B4B4B", value: "" };
      } else if (
        asset.uri === dependencies[colIndex]?.dependent?.uri ||
        asset.uri === dependencies[colIndex]?.provider?.uri
      ) {
        grid[rowIndex][colIndex] = {
          color: dependencies[colIndex].criticalityColor,
          value: dependencies[colIndex].criticality,
        };
      } else {
        grid[rowIndex][colIndex] = { color: "transparent", value: "" };
      }
    }
  }
  return { grid, headings };
};

const Grid = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const { assets, dependencies } = useContext(ElementsContext);

  if (isEmpty(assets)) return null;
  const { grid, headings } = generateCarverMatrix(assets, dependencies);

  return (
    <>
      <div className="overflow-auto" style={{ height: '95%' }}>
        <table
          className="carver-grid--fixed table-fixed w-full border-collapse text-sm"
          style={{ zoom: `${zoomLevel}%` }}
        >
          <colgroup>
            <col span={3} className="sticky left-0" />
          </colgroup>
          <thead>
            <tr className="h-12">
              <th scope="row" colSpan={HEADINGS_COL_SPAN} className="w-32"></th>
              {headings.map((head) => (
                <th scope="row" className="border border-slate-300 w-12">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="w-full h-full overflow-auto">
            {grid.map((row, index) => (
              <tr key={row} className="h-12">
                <th scope="col" className="border border-slate-300">
                  {row[0]}
                </th>
                <td
                  className="border border-slate-300 text-black-100 text-center"
                  style={{ backgroundColor: assets[index].countColor }}
                >
                  {row[1]}
                </td>
                <td
                  className="border border-slate-300 text-black-100 text-center"
                  style={{ backgroundColor: assets[index].criticalitySumColor }}
                >
                  {row[2]}
                </td>
                {row.slice(HEADINGS_COL_SPAN).map((val, index) => (
                  <td
                    key={index}
                    className="border border-slate-300 text-black-100 text-center"
                    style={{ backgroundColor: val.color }}
                  >
                    {val.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GridToolbar zoom={zoomLevel} setZoom={setZoomLevel} />
    </>
  );
};

export default Grid;
