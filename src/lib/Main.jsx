import React from "react";
import ErrorHandler from "./ErrorHandler";

const isConfigValid = (config) => config && typeof config === "object" && config.api && config.api.url;

const Main = ({ config, children }) => {
  if (!isConfigValid(config)) {
    return <ErrorHandler message="Invalid config." />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "inherit",
        height: "calc(100% - 24px)",
      }}
    >
      {children}
    </div>
  );
};

export default Main;
