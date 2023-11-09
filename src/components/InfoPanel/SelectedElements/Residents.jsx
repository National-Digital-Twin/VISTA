import { isEmpty, lowerCase } from "lodash";
import React, { useState } from "react";
import { useQuery } from "react-query";
import PropTypes from "prop-types";

import { DetailsSection } from "lib";
import api from "../../../api";

const TYPES = ["residential building"];

const Residents = ({ isAsset, assetUri, primaryType }) => {
  const { fetchResidents } = api.assets;

  const hasResidents = TYPES.some((type) => type === lowerCase(primaryType));
  const {
    isIdle,
    isLoading,
    isError,
    error,
    data: residents,
  } = useQuery(["residents", assetUri], () => fetchResidents(assetUri), {
    enabled: !!assetUri && isAsset && hasResidents,
  });

  const [expand, setExpand] = useState(false);

  const totalResidents = residents?.length || 0;

  const toggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isIdle) return null;
  if (isLoading) {
    return <p className="bg-black-100 rounded-lg px-4 py-3">Fetching residents information</p>;
  }
  if (isError) return <p className="bg-red-900 rounded-lg px-4 py-3">{error.message}</p>;
  if (isEmpty(residents)) return null;

  return (
    <DetailsSection
      expand={expand}
      onToggle={toggleSection}
      title={`${totalResidents} resident${totalResidents > 1 ? "s" : ""}`}
    >
      <ul>
        {residents.map((resident) => {
          const residentName = resident?.name;
          return <li key={residentName ?? resident.uri}>{residentName || resident.uri}</li>;
        })}
      </ul>
    </DetailsSection>
  );
};

export default Residents;
Residents.defaultProps = {
  primaryType: undefined,
  assetUri: undefined,
};
Residents.propTypes = {
  isAsset: PropTypes.bool.isRequired,
  primaryType: PropTypes.string,
  assetUri: PropTypes.string,
};
