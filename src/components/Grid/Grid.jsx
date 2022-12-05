import React, { useContext, useState } from "react";
import { isEmpty } from "lodash";

import { ElementsContext } from "context";

import GridToolbar from "./GridToolbar";
import { generateCarverGrid, HEADINGS_COL_SPAN } from "./grid-utils";

import "./grid.css";

const Grid = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const { assets, dependencies } = useContext(ElementsContext);

  if (isEmpty(assets)) return null;
  const { grid, headings } = generateCarverGrid(assets, dependencies);

  return (
    <>
      <div className="overflow-auto" style={{ height: "95%" }}>
        <table
          className="carver-grid--fixed table-fixed w-full border-collapse text-sm"
          style={{ zoom: `${zoomLevel}%` }}
        >
          <thead>
            <tr className="h-12">
              <th scope="colgroup" colSpan={HEADINGS_COL_SPAN} className="w-32"></th>
              {headings.map((head) => (
                <th scope="col" className="border border-slate-300 w-12">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="w-full h-full overflow-auto">
            {grid.map((row, rowIndex) => (
              <tr key={row} className="h-12">
                <th scope="row" className="border border-slate-300">
                  {row[0]}
                </th>
                <td
                  className="border border-slate-300 text-black-100 text-center"
                  style={{ backgroundColor: assets[rowIndex].countColor }}
                >
                  {row[1]}
                </td>
                <td
                  className="border border-slate-300 text-black-100 text-center"
                  style={{ backgroundColor: assets[rowIndex].criticalitySumColor }}
                >
                  {row[2]}
                </td>
                {row.slice(HEADINGS_COL_SPAN).map((val, colIndex) => (
                  <td
                    key={`asset-${[assets[rowIndex]]}-col${colIndex}`}
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
