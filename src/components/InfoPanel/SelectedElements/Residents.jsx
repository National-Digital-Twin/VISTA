import { isEmpty, lowerCase } from "lodash";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";

import { DetailsSection } from "lib";
import { fetchResidents } from "api/combined";

const TYPES = ["residential building"];

const Residents = ({ isAsset, assetUri, primaryType }) => {
  const hasResidents = TYPES.some((type) => type === lowerCase(primaryType));
  const {
    isIdle,
    isLoading,
    isError,
    error,
    data: residents,
  } = useQuery({
    enabled: !!assetUri && isAsset && hasResidents,
    queryKey: ["residents", assetUri],
    queryFn: () => fetchResidents(assetUri),
  });

  const [expand, setExpand] = useState(false);

  const totalResidents = residents?.length || 0;

  const toggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isIdle) return null;
  if (isLoading) {
    return <p className="px-4 py-3 rounded-lg bg-black-100">Fetching residents information</p>;
  }
  if (isError) return <p className="px-4 py-3 bg-red-900 rounded-lg">{error.message}</p>;
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
