import { isEmpty } from "lodash";
import { useFetch } from "use-http";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";

const LIMIT = 3;

const ResidentialInformation = ({ isAsset, primaryType, uri }) => {
  const { get, response, loading, error } = useFetch();
  const [residences, setResidences] = useState([]);

  const isPerson = useMemo(() => primaryType?.toLowerCase() === "person" || false, [primaryType]);

  useEffect(() => {
    const getResidentialInformation = async (uri) => {
      const url = `/person/residences?${new URLSearchParams({
        personUri: uri,
      }).toString()}`;

      const residences = await get(url);
      response.ok ? setResidences(residences) : setResidences([]);
    };

    if (isAsset && isPerson && uri) {
      getResidentialInformation(uri);
    }
  }, [get, isAsset, isPerson, uri, response]);

  if (!isPerson && isEmpty(residences)) return null;
  return (
    <div className="flex flex-col gap-y-1">
      <div className="flex justify-between items-center text-whiteSmoke-300">
        <h4 className="uppercase">Residential Information</h4>
        {residences.length > LIMIT && (
          <p className="text-sm">{residences.length} addresses found</p>
        )}
      </div>
      <Addresses residences={residences} loading={loading} error={error} />
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

const Addresses = ({ residences, loading, error }) => {
  const WRAPPER_CLASSNAMES = "flex flex-col gap-y-2 bg-black-100 p-2 rounded-sm";

  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (isEmpty(residences)) return [];
    return showAll ? residences : residences.slice(0, LIMIT);
  }, [showAll, residences]);

  if (loading) return <p className={WRAPPER_CLASSNAMES}>Fetching residential addresses</p>;
  if (error)
    return (
      <p className={WRAPPER_CLASSNAMES}>
        An error occured while retrieving residential information
      </p>
    );
  if (isEmpty(residences))
    return <p className={WRAPPER_CLASSNAMES}>Residential information not found</p>;

  return (
    <>
      <ul className={WRAPPER_CLASSNAMES}>
        {items.map((residence, index) => {
          const section = `Address ${index + 1}`;
          return (
            <li key={residence?.uri || section}>
              <p className="font-semibold text-sm">{section}</p>
              <p>{residence?.address || "N/D"}</p>
            </li>
          );
        })}
      </ul>
      {residences.length > LIMIT && (
        <button className="text-sm" onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? "minimise" : "see all"}
        </button>
      )}
    </>
  );
};
Addresses.defaultProps = {
  loading: false,
  error: undefined,
};
Addresses.propTypes = {
  residences: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
