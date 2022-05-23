import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import config from "../config/app-config";

const isNumber = (value) => typeof value === "number";

const ConnectionMarkup = (connection) => ({
  type: "scattermapbox",
  marker: { size: 14, cmin: 1, cmax: 5, color: ["#0f0", "#0f0"] },
  line: { color: "#f00" },
  mode: "lines+markers",
  lon: connection ? [connection.sourceLon, connection.targetLon] : [],
  lat: connection ? [connection.sourceLat, connection.targetLat] : [],
});

const AssetMarkup = (asset) => ({
  type: "scattermapbox",
  marker: { size: 14, cmin: 1, cmax: 5, color: ["#0f0", "#0f0"] },
  mode: "markers",
  lon: asset ? [asset.lon] : [],
  lat: asset ? [asset.lat] : [],
});

const TelicentMap = ({ element }) => {
  const mapRef = useRef(null);
  const [center, setCenter] = useState({ lat: 50.6742, lon: -1.284 });
  const [data, setData] = useState([ConnectionMarkup()]);

  const drawAsset = (element) => {
    setData([AssetMarkup(element)]);
    setCenter({ lat: element.lat, lon: element.lon });
  };

  const drawConnection = (element) => {
    setData([ConnectionMarkup(element)]);
    setCenter({ lat: element.sourceLat, lon: element.sourceLon });
  };

  const drawMarkup = (element) => {
    if (element.category === "asset") {
      drawAsset(element);
    } else if (element.category === "connection") {
      drawConnection(element);
    }
  };

  useEffect(() => {
    if (!element || !element.category) return;

    drawMarkup(element);
  }, [element, mapRef]);

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
