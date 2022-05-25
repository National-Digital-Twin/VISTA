import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";

const colourMap = {
  1: "green",
  2: "yellow",
  3: "red",
};

const ScatterMarker = ({
  sourceLon,
  targetLon,
  sourceLat,
  targetLat,
  size,
  label,
  name,
  text,
  color,
}) => ({
  type: "scattermapbox",
  line: { color: "#f00" },
  marker: {
    size,
    cmin: 1,
    cmax: 5,
  },
  mode: "markers+text+lines",
  name,
  text,
  color,
  lon: [sourceLon, targetLon],
  lat: [sourceLat, targetLat],
});

const ConnectionMarkup = (connection) => ({
  type: "scattermapbox",
  marker: {
    size: 14,
    cmin: 1,
    cmax: 5,
    color: [connection.sourceScoreColour, connection.targetScoreColour],
  }, // colours should be based on criticality
  line: { color: "#f00" },
  mode: "markers+text+lines",
  lon: connection ? [connection.sourceLon, connection.targetLon] : [],
  lat: connection ? [connection.sourceLat, connection.targetLat] : [],
});

const AssetMarkup = (asset) => {
  if (!asset) {
    return {
      type: "scattermapbox",
      marker: {
        size: 14,
        cmin: 1,
        cmax: 5,
      },
      line: { color: "#f00", text: "" }, // line colour should be based on severity
    };
  }
  let name, text, lon, lat, color, size;

  if (asset.targetName) {
    name = `${asset.targetName} (${asset.label})`;
    text = [asset.sourceName, asset.targetName];
    lon = [asset.sourceLon, asset.targetLon];
    lat = [asset.sourceLat, asset.targetLat];
    color = [asset.sourceScoreColour, asset.targetScoreColour];
    size = 7;
  } else {
    name = `${asset.sourceName} (${asset.label})`;
    text = asset.sourceName;
    lon = [asset.sourceLon];
    lat = [asset.sourceLat];
    size = 14;
    color = [asset.sourceScoreColour];
  }

  return {
    type: "scattermapbox",
    marker: {
      size,
      cmin: 1,
      cmax: 5,
      color,
    },
    line: { color: colourMap[asset.criticality], text: asset.label },
    text,
    name,
    mode: "markers+text+lines",
    lon,
    lat,
  };
};

const TelicentMap = ({ element, connections }) => {
  const [center, setCenter] = useState({ lat: 50.6742, lon: -1.284 });
  const [data, setData] = useState([AssetMarkup()]);

  const drawAsset = (element, connections) => {
    let connectedAssets = connections
      .filter((connection) => {
        return (
          connection.source === element.uri || connection.target === element.uri
        );
      })
      .map(AssetMarkup);

    if (connectedAssets.length < 1) {
      connectedAssets = [
        AssetMarkup({
          sourceLon: element.lon,
          sourceLat: element.lat,
          label: element.name,
          sourceName: element.name,
        }),
      ];
    }

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
          bgcolor: "rgba(17,17,17,0.3",
        },
        autosize: true,
        mapbox: {
          style: "mapbox://styles/mapbox/dark-v10",
          center: center,
          bearing: 0,
          margin: { r: 0, t: 0, b: 0, l: 0 },
          zoom: 10,
          accesstoken:
            "pk.eyJ1IjoibXJkNTA0IiwiYSI6ImNrcXkwaDY0dDA2NXkycXM2ZHY1b3VkbjcifQ.WSLCm8FHh9xj8lnZiRjdZg",
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
