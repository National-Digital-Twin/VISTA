import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import config from "../config/app-config";

const isNumber = (value) => typeof value === "number";

const ConnectionMarkup = (connection) => ({
  type: "scattermapbox",
  marker: { size: 14, cmin: 1, cmax: 5, color: ["#0f0", "#0f0"] },
  line: { color: "#f00" },
  mode: "markers+text+lines",
  lon: connection ? [connection.sourceLon, connection.targetLon] : [],
  lat: connection ? [connection.sourceLat, connection.targetLat] : [],
});

const AssetMarkup = (asset, idx) => {
  console.log(asset);
  return {
    type: "scattermapbox",
    marker: {
      size: 7,
      cmin: 1,
      cmax: 5,
      color: ["#f00", "#0f0"],
    },
    line: { color: "#f00", text: asset.label },
    mode: "markers+text+lines",
    lon: [asset.sourceLon, asset.targetLon],
    lat: [asset.sourceLat, asset.targetLat],
  };
};

const TelicentMap = ({ element, connections }) => {
  const mapRef = useRef(null);
  const [center, setCenter] = useState({ lat: 50.6742, lon: -1.284 });
  const [data, setData] = useState([ConnectionMarkup()]);

  const drawAsset = (element, connections) => {
    const connectedAssets = connections
      .filter((connection) => connection.source === element.uri)
      .map(AssetMarkup);
    setData(connectedAssets);
    setCenter({ lat: element.lat, lon: element.lon });
  };

  const drawConnection = (element) => {
    setData([ConnectionMarkup(element)]);
    setCenter({ lat: element.sourceLat, lon: element.sourceLon });
  };

  const drawMarkup = (element, connections = []) => {
    if (element.category === "asset") {
      drawAsset(element, connections);
    } else if (element.category === "connection") {
      drawConnection(element);
    }
  };

  useEffect(() => {
    if (!element || !element.category) return;

    drawMarkup(element, connections);
  }, [element, mapRef, connections]);

  return (
    <Plot
      divId="plotly"
      ref={mapRef}
      className="graph"
      style={{ width: "100%", height: "100%" }}
      data={data}
      layout={{
        dragmode: "zoom",
        legend: {
          title: "Traces",
          xanchor: "left",
          x: 0.01,
          bgcolor: "rgba(17,17,17,0.3",
        },
        mapbox: {
          style: "mapbox://styles/mapbox/dark-v10",
          center: center,
          bearing: 0,
          margin: { r: 0, t: 0, b: 0, l: 0 },
          autosize: true,
          zoom: 10,
          accesstoken:
            "pk.eyJ1IjoibXJkNTA0IiwiYSI6ImNrcXkwaDY0dDA2NXkycXM2ZHY1b3VkbjcifQ.WSLCm8FHh9xj8lnZiRjdZg",
        },
        margin: { r: 0, t: 0, b: 0, l: 0 },
      }}
    />
  );
};

const TelicentMemoMap = React.memo(TelicentMap);
export default TelicentMemoMap;
