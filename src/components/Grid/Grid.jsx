import React, { useState } from "react";
import classNames from "classnames";
import "./Grid.css";
import GridToolbar from "./GridToolbar";
import { useContext } from "react";
import { ElementsContext } from "../../context/ElementContext";
import { findAsset, getHexColor } from "../../utils";
import { Asset, Connection } from "../../models";

const Grid = ({ loading }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const {
    assets,
    connections,
    assetCriticalityColorScale,
    cxnCriticalityColorScale,
    totalCxnsColorScale,
  } = useContext(ElementsContext);

  const renderAssets = () => {
    const assetGrid = assets.map((asset, index) => (
      <AssetGrid
        asset={asset}
        criticalityColorScale={assetCriticalityColorScale}
        gridIndex={index + 1}
        key={`asset-grid-${asset.id}`}
        totalCxnsColorScale={totalCxnsColorScale}
      />
    ));

    const connectionsGrid = connections.map((connection, index) => (
      <ConnectionGrid
        connection={connection}
        cxnCriticalityColorScale={cxnCriticalityColorScale}
        key={`connection-${connection.id}-${index}`}
        source={findAsset(assets, connection.source)}
        target={findAsset(assets, connection.target)}
        uri={connection.id}
      />
    ));
    return [...assetGrid, ...connectionsGrid];
  };

  if (loading) {
    return (
      <div className="display-center w-full h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div id="grid" className="relative flex-1 h-full w-1/2 overflow-auto">
        <div
          style={{
            zoom: `${zoomLevel}%`,
            gridTemplateColumns: `50px 22px 22px 106px repeat(${assets.length}, 22px)`,
          }}
          className="main-grid"
        >
          {renderAssets()}
        </div>
      </div>
      <GridToolbar zoom={zoomLevel} setZoom={setZoomLevel} />
    </>
  );
};

const AssetGrid = ({ asset, criticalityColorScale, totalCxnsColorScale }) => {
  const { onAssetSelect } = useContext(ElementsContext);
  const { id, label, name, lng, lat, gridIndex, criticality, totalCxns } = asset;

  const criticalityColor = getHexColor(criticalityColorScale, criticality);
  const totalCxnsColor = getHexColor(totalCxnsColorScale, totalCxns);

  const handleOnAssetClick = (event) => {
    const asset = event.target.dataset.asset;
    onAssetSelect([new Asset(JSON.parse(asset))]);
  };

  const AssetIdentifierCol = ({ gridIndex, id, lat, lon, title, uri, onClick }) => (
    <div
      title={title}
      style={{
        position: "sticky",
        left: 0,
        backgroundColor: "black",
        width: "50px",
        gridColumnStart: 1,
        gridRowStart: gridIndex + 1,
        gridColumnEnd: 1,
        gridRowEnd: gridIndex + 1,
      }}
      className={classNames("asset-id", {
        "border-2 border-red-500": !lat || !lon,
      })}
      onClick={onClick}
      id={`${uri}`}
      role="button"
      data-asset={JSON.stringify(asset)}
    >
      {id}
    </div>
  );

  const AssetNameRow = ({ gridIndex, id, lat, lon, title, uri, onClick }) => (
    <div
      title={title}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 99,
        backgroundColor: "black",
        gridColumnStart: gridIndex + 4,
        gridRowStart: 1,
        gridColumnEnd: gridIndex + 4,
        gridRowEnd: 1,
      }}
      className={classNames("col-header", {
        "border-2 border-red-500": !lat || !lon,
      })}
      onClick={onClick}
      id={`${uri}`}
      role="button"
      data-asset={JSON.stringify(asset)}
    >
      {id}
    </div>
  );

  const AssetNameCol = ({ gridIndex, id, name, title }) => (
    <div
      title={title}
      className="asset-id"
      id={id}
      role="cell"
      style={{
        position: "sticky",
        left: "94px",
        backgroundColor: "black",
        overflow: "hidden",
        gridColumnStart: 4,
        gridRowStart: gridIndex + 1,
        gridColumnEnd: 4,
        gridRowEnd: gridIndex + 1,
      }}
    >
      {name}
    </div>
  );
  const BlankCell = ({ gridIndex }) => (
    <div
      className="blank-entry"
      role="cell"
      style={{
        gridColumnStart: gridIndex + 4,
        gridRowStart: gridIndex + 1,
        gridColumnEnd: gridIndex + 4,
        gridRowEnd: gridIndex + 1,
      }}
    />
  );

  const AssetCountCell = ({ color, gridIndex, value }) => (
    <div
      className="asset-id"
      role="cell"
      style={{
        backgroundColor: color,
        position: "sticky",
        left: "50px",
        overflow: "hidden",
        gridColumnStart: 2,
        gridRowStart: gridIndex + 1,
        gridColumnEnd: 2,
        gridRowEnd: gridIndex + 1,
        color: "#1D1D1D",
      }}
      title={value}
    >
      {value}
    </div>
  );

  const AssetCriticalityCell = ({ color, gridIndex, value }) => (
    <div
      className="asset-id"
      role="cell"
      style={{
        backgroundColor: color,
        position: "sticky",
        left: "72px",
        overflow: "hidden",
        gridColumnStart: 3,
        gridRowStart: gridIndex + 1,
        gridColumnEnd: 3,
        gridRowEnd: gridIndex + 1,
        color: "#1D1D1D",
      }}
      title={value}
    >
      {value}
    </div>
  );

  return (
    <>
      <AssetNameRow
        gridIndex={gridIndex}
        id={label}
        title={name}
        lat={lat}
        lon={lng}
        uri={id}
        onClick={handleOnAssetClick}
      />
      <AssetIdentifierCol
        gridIndex={gridIndex}
        title={name}
        id={label}
        onClick={handleOnAssetClick}
        lat={lat}
        lon={lng}
        uri={id}
      />
      <AssetNameCol gridIndex={gridIndex} id={id} title={name} name={name} />
      <BlankCell gridIndex={gridIndex} />
      <AssetCountCell color={totalCxnsColor} gridIndex={gridIndex} value={totalCxns} />
      <AssetCriticalityCell color={criticalityColor} gridIndex={gridIndex} value={criticality} />
    </>
  );
};

const ConnectionBtn = ({ colorScale, criticality, data, position, uri }) => {
  const { onAssetSelect } = useContext(ElementsContext);

  const handleOnConnectionClick = (event) => {
    const connection = event.target.dataset.connection;
    onAssetSelect([new Connection(JSON.parse(connection))]);
  };

  return (
    <button
      className="grid-entry text-black-100"
      style={{
        ...position,
        backgroundColor: getHexColor(colorScale, criticality),
      }}
      onClick={handleOnConnectionClick}
      id={uri}
      data-connection={JSON.stringify(data)}
    >
      {criticality}
    </button>
  );
};

const ConnectionGrid = ({ connection, cxnCriticalityColorScale, source, target, uri }) => {
  if (!source || !target) {
    return null;
  }
  const x = source.gridIndex;
  const y = target.gridIndex;

  const colsInColumnHeader = 4;
  const colsInRowHeader = 1;

  const calculateSourceGridPosition = (x, y) => ({
    gridColumnStart: colsInColumnHeader + x,
    gridColumnEnd: colsInColumnHeader + x,
    gridRowStart: colsInRowHeader + y,
    gridRowEnd: colsInRowHeader + y,
  });

  const calculateTargetGridPosition = (x, y) => ({
    gridColumnStart: colsInColumnHeader + y,
    gridColumnEnd: colsInColumnHeader + y,
    gridRowStart: colsInRowHeader + x,
    gridRowEnd: colsInRowHeader + x,
  });

  return (
    <>
      <ConnectionBtn
        colorScale={cxnCriticalityColorScale}
        criticality={connection.criticality}
        data={connection}
        position={calculateSourceGridPosition(x, y)}
        uri={uri}
      />
      <ConnectionBtn
        colorScale={cxnCriticalityColorScale}
        criticality={connection.criticality}
        data={connection}
        position={calculateTargetGridPosition(x, y)}
        uri={uri}
      />
    </>
  );
};
export default Grid;
