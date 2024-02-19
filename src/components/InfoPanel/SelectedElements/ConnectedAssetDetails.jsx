import React from "react";
import { lowerCase } from "lodash";
import { TeliTypeIcon } from "@telicent-io/ds";

import { getURIFragment } from "utils";

const ConnectedAssetDetails = ({
  error,
  uri,
  name,
  type,
  criticality,
  connectionStrength,
  isAdded,
}) => {
  if (error) {
    return <li className="p-2 bg-red-900 rounded-md">{error.message}</li>;
  }

  return (
    <li className="items-center p-2 rounded-md gap-x-2 bg-black-300">
      <div className="flex items-center gap-x-2">
        <TeliTypeIcon size="sm" type={type} disabled={!isAdded} />
        <div>
          <h4>{name || uri}</h4>
          <p className="text-sm uppercase">{lowerCase(getURIFragment(type))}</p>
          <p className="text-sm">{uri.split("#")[1]}</p>
        </div>
      </div>
      <p className="text-sm whitespace-nowrap">Criticality: {criticality || "N/D"}</p>
      <p className="text-sm whitespace-nowrap">
        Connection Strength: {connectionStrength || "N/D"}
      </p>
    </li>
  );
};

export default ConnectedAssetDetails;
