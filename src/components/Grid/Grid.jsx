import classNames from "classnames";
import { isEmpty } from "lodash";
import React, { useContext, useState } from "react";

import { ElementsContext } from "context";

import GridToolbar from "./GridToolbar";
import { generateCarverGrid, HEADINGS_COL_SPAN } from "./grid-utils";

const Grid = ({ showGrid }) => {
  const { assets, dependencies } = useContext(ElementsContext);
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!showGrid) return null;
  return (
    <>
      <div
        className={classNames("w-full h-full", {
          "flex justify-center items-center": isEmpty(assets),
          "overflow-auto": !isEmpty(assets),
        })}
      >
        <CarverGrid assets={assets} dependencies={dependencies} zoomLevel={zoomLevel} />
      </div>
      <GridToolbar zoom={zoomLevel} setZoom={setZoomLevel} />
    </>
  );
};

export default Grid;

const CarverGrid = ({ assets, dependencies, zoomLevel }) => {
  const { onElementClick, clearSelectedElements } = useContext(ElementsContext);

  const { grid, headings } = generateCarverGrid(assets, dependencies);

  const showAssetInfo = (event, element) => {
    onElementClick(event.shiftKey, element);
  };

  const showDepedencyInfo = (event, element) => {
    if (element) {
      onElementClick(event.shiftKey, element);
      return;
    }
    clearSelectedElements();
  };

  if (isEmpty(assets)) {
    return <p>Add dataset to view grid</p>;
  }

  return (
    <table
      className="table-fixed w-full text-sm border-separate border-spacing-0 mb-14"
      style={{ zoom: `${zoomLevel}%` }}
    >
      <thead className="bg-black-100 sticky top-0" style={{ zIndex: 5 }}>
        <tr className="h-12">
          <th
            scope="colgroup"
            colSpan={HEADINGS_COL_SPAN}
            className="sticky top-0 left-0 w-40 bg-black-100 border-b border-r border-gray-400"
            style={{ zIndex: 5 }}
          ></th>
          {headings.map((assetId, headIndex) => (
            <th
              key={assetId}
              scope="col"
              className="w-16 bg-black-100 truncate border border-gray-400 border-l-0"
              onClick={(event) => showAssetInfo(event, assets[headIndex])}
            >
              {assetId}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="w-full h-full overflow-auto">
        {grid.map((row, rowIndex) => (
          <tr key={row} className="h-12">
            <th
              scope="colgroup"
              colSpan={HEADINGS_COL_SPAN}
              className="sticky left-0 truncate bg-black-100 px-2 py-1 border border-gray-400 border-t-0"
              onClick={(event) => showAssetInfo(event, assets[rowIndex])}
            >
              <p>{row[0]}</p>
              <p className="flex justify-between font-normal mb-1">
                Total dependents
                <span
                  className="w-6 rounded-md text-black-100"
                  style={{ backgroundColor: assets[rowIndex].countColor }}
                >
                  {row[1]}
                </span>
              </p>
              <p className="flex justify-between font-normal">
                Criticality
                <span
                  className="w-6 rounded-md text-black-100"
                  style={{ backgroundColor: assets[rowIndex].criticalityColor }}
                >
                  {row[2]}
                </span>
              </p>
            </th>
            {row.slice(HEADINGS_COL_SPAN).map((col, colIndex) => (
              <td
                key={`dependet-${col.element?.uri}-col${colIndex}`}
                className="border border-gray-400 border-t-0 border-l-0 text-black-100 text-center"
                style={{ backgroundColor: col.color }}
                onClick={(event) => showDepedencyInfo(event, col.element)}
              >
                {col.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
