import { isEmpty } from "lodash";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";

import { fetchResidentialInformation } from "api/combined";

const LIMIT = 3;

const ResidentialInformation = ({ isAsset, primaryType, uri }) => {
  const isPerson = useMemo(() => primaryType?.toLowerCase() === "person" || false, [primaryType]);
  const show = Boolean(uri) && isAsset && isPerson;

  const {
    isLoading,
    isError,
    error,
    data: residences,
  } = useQuery({
    enabled: show,
    queryKey: ["person-residences", uri],
    queryFn: () => fetchResidentialInformation(uri),
  });

  if (!show) return null;

  const totalResidences = residences?.length || 0;

  return (
    <div className="flex flex-col gap-y-1">
      <div className="flex items-center justify-between text-whiteSmoke-300">
        <h3 className="uppercase">Residential Information</h3>
        {totalResidences > LIMIT && <p className="text-sm">{totalResidences} addresses found</p>}
      </div>
      <Addresses residences={residences} isLoading={isLoading} isError={isError} error={error} />
    </div>
  );
};

export default ResidentialInformation;
ResidentialInformation.defaultProps = {
  primaryType: undefined,
  uri: undefined,
};
ResidentialInformation.propTypes = {
  isAsset: PropTypes.bool.isRequired,
  primaryType: PropTypes.string,
  uri: PropTypes.string,
};

const Addresses = ({ residences, isLoading, isError, error }) => {
  const WRAPPER_CLASSNAMES = "flex flex-col gap-y-2 bg-black-100 p-2 rounded-sm";

  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (isEmpty(residences)) return [];
    return showAll ? residences : residences.slice(0, LIMIT);
  }, [showAll, residences]);

  if (isLoading) return <p className={WRAPPER_CLASSNAMES}>Fetching residential addresses</p>;
  if (isError) return <p className={WRAPPER_CLASSNAMES}>{error.message}</p>;
  if (isEmpty(residences))
    return <p className={WRAPPER_CLASSNAMES}>Residential information not found</p>;

  return (
    <>
      <ul className={WRAPPER_CLASSNAMES}>
        {items.map((residence, index) => {
          const section = `Address ${index + 1}`;
          return (
            <li key={residence.uri}>
              <p className="text-sm font-semibold">{section}</p>
              <p>{residence?.address || residence.uri}</p>
            </li>
          );
        })}
      </ul>
      {residences.length > LIMIT && (
        <button className="text-sm" onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? "show less addresses" : "show all addresses"}
        </button>
      )}
    </>
  );
};
Addresses.defaultProps = {
  loading: false,
  error: undefined,
  residences: [],
};
Addresses.propTypes = {
  residences: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.object,
};
