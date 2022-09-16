import React, { useState } from "react";
import classNames from "classnames";
import "./Grid.css";
import useSelectNode from "../hooks/useSelectNode";
import ReactSlider from "react-slider";

const emptyAssets = [];
const emptyConnections = [];
const TelicentGrid = ({
  assets = emptyAssets,
  connections = emptyConnections,
  loading,
}) => {
  const [setSelectedNode] = useSelectNode(assets, connections);
  const onClick = (type) => (e) => {
    const { target } = e;
    setSelectedNode(target.id, type);
  };

  const [zoomLevel, setZoomLevel] = useState(100);
  const grid = `50px 22px 22px 106px repeat(${assets.length}, 22px)`;
  const renderAssets = () => {
    const assetGrid = assets.map((asset) => (
      <AssetGrid
        asset={asset}
        key={`asset-grid-${asset.uri}`}
        onClick={onClick("asset")}
      />
    ));

    const connectionsGrid = connections.map((connection, index) => (
      <ConnectionGrid
        uri={connection.uri}
        key={`connection-${connection.uri}-${index}`}
        criticality={connection.criticality}
        source={assets.find(
          (asset) => asset.uri === connection.sourceAsset.uri
        )}
        target={assets.find(
          (asset) => asset.uri === connection.targetAsset.uri
        )}
        onClick={onClick("connection")}
      />
    ));
    return [...assetGrid, ...connectionsGrid];
  };
  if (!Array.isArray(assets) || !Array.isArray(connections)) {
    console.warn(
      "TelicentGrid -> Assets and connections must be passed in as an array."
    );
    return;
  }

  const onSliderChange = (value) => {
    setZoomLevel(value * 10);
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
      <ReactSlider
        className="horizontal-slider"
        marks
        defaultValue={zoomLevel}
        markClassName="slider-mark"
        min={1}
        max={10}
        onChange={onSliderChange}
        thumbClassName="slider-thumb"
        trackClassName="slider-track"
        renderThumb={(props, state) => {
          return <div {...props}>{`${state.valueNow * 10}%`}</div>;
        }}
      />
      <div
        className="h-full w-full"
        style={{
          position: "relative",
          overflow: "auto",
          marginBottom: "12px",
          marginRight: "12px",
        }}
      >
        <div style={{ width: "inherit" }}>
          <div
            style={{
              zoom: `${JSON.stringify(zoomLevel)}%`,
              gridTemplateColumns: grid,
            }}
            className="main-grid"
          >
            {renderAssets()}
          </div>
        </div>
      </div>
    </>
  );
};

const AssetGrid = ({ asset, onClick }) => {
  const {
    id,
    uri,
    name,
    count,
    lon,
    lat,
    criticality,
    countColour,
    scoreColour,
    gridIndex,
  } = asset;

  const AssetIdentifierCol = ({
    gridIndex,
    id,
    lat,
    lon,
    title,
    uri,
    onClick,
  }) => (
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
        id={id}
        title={name}
        lat={lat}
        lon={lon}
        uri={uri}
        onClick={onClick}
      />
      <AssetIdentifierCol
        gridIndex={gridIndex}
        title={name}
        id={id}
        onClick={onClick}
        lat={lat}
        lon={lon}
        uri={uri}
      />
      <AssetNameCol gridIndex={gridIndex} id={id} title={name} name={name} />
      <BlankCell gridIndex={gridIndex} />
      <AssetCountCell color={countColour} gridIndex={gridIndex} value={count} />
      <AssetCriticalityCell
        color={scoreColour}
        gridIndex={gridIndex}
        value={criticality}
      />
    </>
  );
};

const ConnectionGrid = ({ uri, criticality, source, target, onClick }) => {
  if (!source || !target) {
    return null;
  }
  const x = source.gridIndex;
  const y = target.gridIndex;

  const colsInColumnHeader = 4;
  const colsInRowHeader = 1;

  const calculateSourceGridPosition = (x, y) => {
    return {
      gridColumnStart: colsInColumnHeader + x,
      gridColumnEnd: colsInColumnHeader + x,
      gridRowStart: colsInRowHeader + y,
      gridRowEnd: colsInRowHeader + y,
    };
  };

  const calculateTargetGridPosition = (x, y) => {
    return {
      gridColumnStart: colsInColumnHeader + y,
      gridColumnEnd: colsInColumnHeader + y,
      gridRowStart: colsInRowHeader + x,
      gridRowEnd: colsInRowHeader + x,
    };
  };

  return (
    <>
      <div
        className={`grid-entry grid-entry-${criticality}`}
        style={calculateSourceGridPosition(x, y)}
        onClick={onClick}
        id={`${uri}`}
        role="button"
      >
        {criticality}
      </div>
      <div
        className={`grid-entry grid-entry-${criticality}`}
        style={calculateTargetGridPosition(x, y)}
        onClick={onClick}
        id={`${uri}`}
        role="button"
      >
        {criticality}
      </div>
    </>
  );
};
export default TelicentGrid;
