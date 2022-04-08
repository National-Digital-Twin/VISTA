import React, { useContext } from "react";
import { AssetContext } from "../AssetContext";
import "./Grid.css";
const TelicentGrid = ({ assets = [], connections = [] }) => {
  const {onSelectedNode} = useContext(AssetContext)
  const onClick = (type) => (e) => {
    const {target} = e
    
      onSelectedNode(target.id, type)
    
  }
  const [zoom, setZoom] = React.useState(100);
  const grid = `50px 22px 22px 106px repeat(${assets.length}, 22px)`;
  const renderAssets = () => {
    const assetGrid = assets.map((asset) => (
      <AssetGrid
        id={asset.id}
        uri={asset.uri}
        name={asset.name}
        gridIndex={asset.gridIndex}
        scoreColour={asset.scoreColour}
        countColour={asset.countColour}
        count={asset.count}
        criticality={asset.criticality}
        onClick={onClick("asset")}
      />
    ));
    const connectionsGrid = connections.map(connection => (
        <ConnectionGrid 
            uri={connection.uri}
            criticality={connection.criticality}
            source={assets.find(asset=> asset.uri=== connection.source)}
            target={assets.find(asset=> asset.uri=== connection.target)}
            onClick={onClick("connection")}
        />
    ))
    return [...assetGrid,...connectionsGrid];
  };

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

const AssetGrid = ({ id, uri, name, count, criticality, countColour, scoreColour, gridIndex, onClick }) => {
  return (
    <>
      <div
        className="asset-id"
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
        onClick={onClick} id={`${uri}`}
        role="button"
      >{id}
      </div>
      <div
        title={name}
        id={id}
        className="asset-id"
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
        className="col-header"
        onClick={onClick} id={`${uri}`}
        role="button"
      >
         {id}
      </div>

      <div
        className="blank-entry"
        style={{
          gridColumnStart: gridIndex + 4,
          gridRowStart: gridIndex + 1,
          gridColumnEnd: gridIndex + 4,
          gridRowEnd: gridIndex + 1,
        }}
      />
      <div className="asset-id"
        style={{
            backgroundColor: countColour,
            position: "sticky",
            left: "50px",
            overflow: "hidden",
            gridColumnStart: 2,
            gridRowStart: gridIndex+1,
            gridColumnEnd: 2,
            gridRowEnd: gridIndex+1
        }}
      >{count}</div>
      <div className="asset-id"
        style={{
            backgroundColor: scoreColour,
            position: "sticky",
            left: "72px",
            overflow: "hidden",
            gridColumnStart: 3,
            gridRowStart: gridIndex+1,
            gridColumnEnd: 3,
            gridRowEnd: gridIndex+1
        }}>{criticality}</div>
    </>
  );
};

const ConnectionGrid = ({uri, criticality, source, target,onClick }) => {
    if(!source || !target){
        return null
    }
    const x = source.gridIndex
    const y = target.gridIndex
    return (
    <>
        <div 
            className={`grid-entry grid-entry-${criticality}`}
            style={{
                gridColumnStart: x+4,
                gridColumnEnd: x+4,
                gridRowStart: y+1,
                gridRowEnd: y+1
            }}
         onClick={onClick} id={`${uri}`} role="button">{criticality}
        </div>
        <div 
            className={`grid-entry grid-entry-${criticality}`}
            style={{
                gridColumnStart: y+4,
                gridColumnEnd: y+4,
                gridRowStart: x+1,
                gridRowEnd: x+1
            }}
            onClick={onClick} id={`${uri}`} role="button"
        >
           {criticality}
        </div>
    </>
)}
export default TelicentGrid;
