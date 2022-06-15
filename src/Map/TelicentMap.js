import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { IsEmpty } from "../utils";
import config from "../config/app-config";

const TelicentMap = ({ element, connections }) => {
  const center = { lat: 50.66206632912732, lon: -1.3480234953335598 };
  const [data, setData] = useState([{ type: "scattermapbox" }]);

  const drawMarkup = (element, connections = []) => {
    const connection = connections.find(
      (connection) => connection.uri === element.uri
    );
    if (connection) {
      setData(connection.getMapboxMarkup());
      return;
    }

    let connectedAssets = connections
      .filter((connection) => {
        return (
          connection.sourceAsset.uri === element.uri ||
          connection.targetAsset.uri === element.uri
        );
      })
      .map((asset) => asset.getMapboxMarkup())
      .flat();

    if (IsEmpty(connectedAssets)) {
      setData([element.getMapboxMarkup()]);
      return;
    }

    setData(connectedAssets);
  };

  useEffect(() => {
    if (!element || !element.category) return;

    drawMarkup(element, connections);
  }, [element, connections]);

  return (
    <Plot
      divId="plotly"
      className="graph"
      style={{ width: "100%", height: "100%" }}
      data={data}
      layout={{
        dragmode: "zoom",
        legend: {
          title: "Traces",
          xanchor: "left",
          x: 0.01,
          bgcolor: "rgba(17,17,17,0.3)",
        },
        autosize: true,
        mapbox: {
          style: "mapbox://styles/mapbox/dark-v10",
          center: center,
          bearing: 0,
          margin: { r: 0, t: 0, b: 0, l: 0 },
          zoom: 10,
          accesstoken: config.mb.token,
        },
        margin: { r: 0, t: 0, b: 0, l: 0 },
        font: {
          color: "white",
        },
      }}
    />
  );
};

const TelicentMemoMap = React.memo(TelicentMap);
export default TelicentMemoMap;
