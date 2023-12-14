import { lowerCase } from "lodash";
import React from "react";

import { AssetIcon } from "lib";

const AssetDetails = ({
  error,
  uri,
  name,
  type,
  criticality,
  connectionStrength,
  backgroundColor,
  color,
  icon,
}) => {
  if (error) {
    return <li className="bg-red-900 rounded-md p-2">{error.message}</li>;
  }

  return (
    <li className="gap-x-2 bg-black-300 rounded-md p-2 items-center">
      <div className="flex items-center gap-x-2">
        <AssetIcon
          backgroundColor={backgroundColor}
          color={color}
          icon={icon}
          iconLabel={type.substring(0, 3)}
        />
        <div>
          <h4>{name || uri}</h4>
          <p className="uppercase" style={{ fontSize: "13px" }}>
            {type.includes("http") ? type : lowerCase(type)}
          </p>
          <p className="text-sm">{uri.split("#")[1]}</p>
        </div>
      </div>
      <p className="whitespace-nowrap text-sm">Criticality: {criticality || "N/D"}</p>
      <p className="whitespace-nowrap text-sm">
        Connection Strength: {connectionStrength || "N/D"}
      </p>
    </li>
  );
};

export default AssetDetails;
