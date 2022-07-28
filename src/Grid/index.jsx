import React from "react";
import classNames from "classnames";
import "./Grid.css";
import useSelectNode from "../hooks/useSelectNode";

const emptyAssets = [];
const emptyConnections = [];
const TelicentGrid = ({
  assets = emptyAssets,
  connections = emptyConnections,
}) => {
  const [setSelectedNode] = useSelectNode(assets, connections);
  const onClick = (type) => (e) => {
    const { target } = e;
    setSelectedNode(target.id, type);
  };

  const zoom = 100;
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
  return (
    <div
      className="h-full w-full"
      style={{
        position: "relative",
        // height: "calc(100% - 24px)",
        overflow: "auto",
        marginBottom: "12px",
        marginRight: "12px",
      }}
    >
      <div style={{ width: "inherit" }}>
        <div
          style={{
            zoom: `${JSON.stringify(zoom)}%`,
            gridTemplateColumns: grid,
          }}
          className="main-grid"
        >
          {renderAssets()}
        </div>
      </div>
    </div>
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

  return (
    <>
      <div
        title={name}
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
      <div
        title={name}
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
      <div
        title={name}
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
      <div
        className="asset-id"
        role="cell"
        style={{
          backgroundColor: countColour,
          position: "sticky",
          left: "50px",
          overflow: "hidden",
          gridColumnStart: 2,
          gridRowStart: gridIndex + 1,
          gridColumnEnd: 2,
          gridRowEnd: gridIndex + 1,
        }}
      >
        {count}
      </div>
      <div
        className="asset-id"
        role="cell"
        style={{
          backgroundColor: scoreColour,
          position: "sticky",
          left: "72px",
          overflow: "hidden",
          gridColumnStart: 3,
          gridRowStart: gridIndex + 1,
          gridColumnEnd: 3,
          gridRowEnd: gridIndex + 1,
        }}
      >
        {criticality}
      </div>
    </>
  );
};

const ConnectionGrid = ({ uri, criticality, source, target, onClick }) => {
  // why is previous element becoming undefined?
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
