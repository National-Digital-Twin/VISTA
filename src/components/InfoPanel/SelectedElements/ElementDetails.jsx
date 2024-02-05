import React, { useEffect, useRef, useState } from "react";
import { isEmpty, lowerCase } from "lodash";
import classNames from "classnames";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";

import { fetchAssetInfo } from "api/combined";
import { getURIFragment, isAsset, isDependency } from "utils";

import Dependents from "./Dependents";
import Providers from "./Providers";
import ResidentialInformation from "./ResidentialInformation";
import Residents from "./Residents";

const ElementDetails = ({ element, expand, onViewDetails }) => {
  const elemIsAsset = isAsset(element);
  const elemIsDependency = isDependency(element);

  const assetInfo = useQuery({
    enabled: elemIsAsset,
    queryKey: ["asset-info", element?.uri],
    queryFn: () => fetchAssetInfo(element?.uri),
  });

  const dependentInfo = useQuery({
    queryKey: ["asset-info", element?.dependent?.uri],
    queryFn: () => fetchAssetInfo(element?.dependent?.uri),
    enabled: elemIsDependency,
  });

  const providerInfo = useQuery({
    queryKey: ["asset-info", element?.provider?.uri],
    queryFn: () => fetchAssetInfo(element?.provider?.uri),
    enabled: elemIsDependency,
  });

  const isLoading = assetInfo.isLoading || dependentInfo.isLoading || providerInfo.isLoading;
  const isError = assetInfo.isError || dependentInfo.isError || providerInfo.isError;

  if (isLoading) return <p>Fetching element details</p>;
  if (isError) return <p>An error has occured while fetching information for {element.uri}</p>;

  let details = undefined;
  if (elemIsAsset) details = element.getDetails(assetInfo.data);
  if (elemIsDependency) {
    details = element.getDetails(dependentInfo.data.name, providerInfo.data.name);
  }

  if (isEmpty(element) || !details) {
    return <p>Unable to retrieve details for unknown element or details not found</p>;
  }

  if (!expand) {
    return (
      <li className="border-b border-whiteSmoke-800">
        <button aria-label={details.title} onClick={onViewDetails} className="pb-3 text-left">
          <Details expand={false} details={details} />
        </button>
      </li>
    );
  }

  return (
    <div id="element-details" className="flex flex-col min-h-0 pt-2 overflow-y-auto grow gap-y-4">
      <Details expand details={details} />
      <ResidentialInformation
        isAsset={elemIsAsset}
        primaryType={element.primaryType}
        uri={element.uri}
      />
      <Residents isAsset={elemIsAsset} assetUri={element.uri} primaryType={element.primaryType} />
      <Dependents
        isAsset={elemIsAsset}
        isDependency={elemIsDependency}
        assetUri={element.uri}
        dependent={element?.dependent}
      />
      <Providers
        isAsset={elemIsAsset}
        isDependency={elemIsDependency}
        assetUri={element.uri}
        provider={element?.provider}
      />
    </div>
  );
};
export default ElementDetails;
ElementDetails.propTypes = {
  element: PropTypes.object,
  expand: PropTypes.bool,
  onViewDetails: PropTypes.func,
};

const Details = ({ expand, details }) => {
  const { id, title, criticality, type, desc, icon } = details;
  return (
    <div className="grid gap-y-1">
      <div className="asset__details">
        <span
          id="asset-icon"
          className="flex items-center justify-center w-12 h-12"
          style={{ ...icon.style }}
        >
          {icon?.iconLabel ? (
            <span className="text-whiteSmoke">{icon.iconLabel}</span>
          ) : (
            <span className={icon.icon} />
          )}
        </span>
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          {type && <p className="text-sm uppercase">{lowerCase(getURIFragment(type))}</p>}
          <p>{id}</p>
        </div>
      </div>
      {expand && (
        <>
          {icon?.iconLabel && (
            <p className="flex items-center px-2 bg-yellow-600 rounded-md gap-x-2 text-black-100 w-fit">
              <i className="fa-light fa-diamond-exclamation text-black-100" />
              Icon styles not found
            </p>
          )}
          <p>Criticality: {criticality}</p>
          <Description description={desc} />
        </>
      )}
    </div>
  );
};

const Description = ({ description }) => {
  const descRef = useRef();
  const [showMore, setShowMore] = useState(true);
  const [isLineClampApplied, setIsLineClampApplied] = useState(true);

  useEffect(() => {
    const clientHeight = descRef.current?.clientHeight;
    const scrollHeight = descRef.current?.scrollHeight;

    if (clientHeight === scrollHeight) {
      setIsLineClampApplied(true);
      return;
    }
    setIsLineClampApplied(false);
  }, [descRef]);

  if (!description) return null;

  const handleShowMore = () => {
    setShowMore((show) => !show);
  };

  return (
    <div id="description">
      <p ref={descRef} className={classNames({ "line-clamp": showMore })}>
        {description}
      </p>
      {isLineClampApplied && showMore ? null : (
        <button
          className="flex items-center float-right text-sm w-fit gap-x-1"
          onClick={handleShowMore}
        >
          show {showMore ? "more" : "less"}
          <span
            className={classNames("!text-sm", {
              "ri-arrow-down-s-fill ": showMore,
              "ri-arrow-up-s-fill ": !showMore,
            })}
          />
        </button>
      )}
    </div>
  );
};
