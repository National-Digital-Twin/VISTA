import React, { useCallback, useEffect, useState, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import Fuel from "./assets/gas-station-fill-green.svg";
import Medical from "./assets/medical_services_green_24dp.svg";
import Phone from "./assets/phone-fill-coral.svg";
import Drop from "./assets/drop-fill-blue.svg";
import Battery from "./assets/battery-charge-fill-teal.svg";
import Car from "./assets/car-fill-aqua.svg";
import useSelectNode from "../hooks/useSelectNode";
import { createContext } from "react";
import { IsEmpty } from "../utils";

const emptyAssets = [];
const emptyConnections = [];

const Network = React.memo(({ cyRef, configureCy }) => {
  // const [setSelectedNode] = useSelectNode(assets, connections);

  const layout = "cose";
  // const [elements, setElements] = useState([]);

  // const listener = useCallback(
  //   (e) => {
  //     e.preventDefault();
  //     const { target } = e;

  //     const {
  //       group,
  //       data: { id: targetId, uri: targetUri },
  //     } = target[0]._private;
  //     const type = group === "nodes" ? "asset" : "connection";
  //     const uri = group === "nodes" ? targetId : targetUri;

  //     setSelectedNode(uri, type);
  //   },
  //   [setSelectedNode]
  // );

  const focusCytoScapeContent = useCallback(() => {
    cyRef.current.resize();
    cyRef.current.layout({ name: layout }).run();
    cyRef.current.center();
    cyRef.current.fit();
  }, [cyRef]);

  // useEffect(() => {
  //   const nodes = assets.map((asset) => ({
  //     data: {
  //       id: asset.uri,
  //       label: asset.id,
  //       style: {
  //         "border-color": asset.scoreColour,
  //         height: `${asset.count + 40}`,
  //         width: `${asset.count + 40}`,
  //       },
  //     },
  //     classes: asset.id.charAt(0), // set class on cytospace node to add image
  //   }));
  //   const links = connections.map((connection) => ({
  //     data: connection,
  //     classes: `${connection.criticality}`,
  //   }));
  //   setElements([...nodes, ...links]);
  // }, [assets, connections]);

  // useEffect(() => {
  //   if (!cyRef.current) return;
  //   focusCytoScapeContent();
  // }, [cyRef, focusCytoScapeContent]);

  useEffect(() => {
    return () => {
      console.log("unmount");
      if (!cyRef.current) return;
      cyRef.current.removeAllListeners();
      cyRef.current = null;
    };
  }, [cyRef]);

  return (
    <CytoscapeComponent
      layout={{ name: layout }}
      cy={configureCy}
      className="w-full h-full"
      elements={[]}
      stylesheet={[
        {
          selector: "node",
          style: {
            width: "60px",
            height: "60px",
            borderWidth: "4px",
            borderColor: "gray",
            backgroundColor: "black",
            label: "data(label)",
            color: "white",
            fontSize: "0.6em",
            textValign: "center",
            textHalign: "center",
            textMarginY: "10px",
            backgroundPositionY: "5px",
          },
        },
        {
          selector: "edge",
          style: {
            curveStyle: "haystack",
            color: "cyan",
            fontSize: "0.6em",
            label: "data(label)",
          },
        },
        {
          selector: ".F",
          style: {
            backgroundImage: `url(${Fuel})`,
            backgroundColor: "black",
          },
        },
        {
          selector: ".M",
          style: {
            backgroundImage: `url(${Medical})`,
            backgroundColor: "black",
          },
        },
        {
          selector: ".C",
          style: {
            backgroundImage: `url(${Phone})`,
            backgroundColor: "black",
          },
        },
        {
          selector: ".W",
          style: {
            backgroundColor: "black",
            backgroundImage: `url(${Drop})`,
          },
        },
        {
          selector: ".T",
          style: {
            backgroundImage: `url(${Car})`,
            backgroundColor: "black",
          },
        },
        {
          selector: ".E",
          style: {
            backgroundImage: `url(${Battery})`,
            backgroundColor: "black",
          },
        },
        {
          selector: ".1",
          style: {
            "line-color": "Yellow",
          },
        },
        {
          selector: ".2",
          style: {
            "line-color": "Goldenrod",
          },
        },
        {
          selector: ".3",
          style: {
            "line-color": "Red",
          },
        },
        {
          selector: ":selected",
          style: {
            backgroundColor: "white",
            borderWidth: "4px",
            borderColor: "white",
            color: "black",
          },
        },
      ]}
    ></CytoscapeComponent>
  );
});

const CytoscapeContext = createContext();
const withData =
  (Component) =>
  ({ assets, connections }) => {
    const cyRef = useRef();
    const [setSelectedNode] = useSelectNode(assets, connections);

    const onTapNode = (e) => {
      console.log(e);
      e.preventDefault();
      const { target } = e;
      console.log(target);

      const {
        group,
        data: { id: targetId, uri: targetUri },
      } = target[0]._private;
      const type = group === "nodes" ? "asset" : "connection";
      const uri = group === "nodes" ? targetId : targetUri;

      setSelectedNode(uri, type);
    };

    useEffect(() => {
      if (!cyRef.current) return;
      const nodes = assets.map((asset) => ({
        data: {
          id: asset.uri,
          label: asset.id,
          style: {
            "border-color": asset.scoreColour,
            height: `${asset.count + 40}`,
            width: `${asset.count + 40}`,
          },
        },
        classes: asset.id.charAt(0), // set class on cytospace node to add image
      }));
      const links = connections.map((connection) => ({
        data: connection,
        classes: `${connection.criticality}`,
      }));
      cyRef.current.elements().remove();
      cyRef.current.add([...nodes, ...links]);
      cyRef.current.resize();
      cyRef.current.layout({ name: "cose" }).run();
      cyRef.current.center();
      cyRef.current.fit();
      // cyRef.current.json({ elements: [...nodes, ...links] });
    }, [assets, connections, cyRef]);
    const configureCy = (cy) => {
      if (cyRef.current) return;
      cyRef.current = cy;
      cyRef.current.on("tap", onTapNode);
      cyRef.current.resize();
      cyRef.current.layout({ name: "cose" }).run();
      cyRef.current.center();
      cyRef.current.fit();
    };

    return (
      <CytoscapeContext.Provider value={{ cyRef, configureCy }}>
        <CytoscapeContext.Consumer>
          {({ cyRef, configureCy }) => (
            <Component cyRef={cyRef} configureCy={configureCy} />
          )}
        </CytoscapeContext.Consumer>
      </CytoscapeContext.Provider>
    );
  };

export default withData(Network);
