import React, { useContext, useEffect, useRef, useState } from "react";
import { camelCase, isEmpty, lowerCase } from "lodash";
import classNames from "classnames";

import config from "config/app-config";
import { ElementsContext } from "context";
import { getURIFragment, isAsset, isElementCached } from "utils";
import { useJSFetch, useLocalStorage, useOntologyServer } from "hooks";
import ResidentialInformation from "./ResidentialInformation";

const ElementDetails = ({ element, expand, onViewDetails }) => {
  const { error, get } = useJSFetch();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const getAssetInformation = async (uri) => {
      const url = `${config.api.url}/asset?${new URLSearchParams({ assetUri: uri }).toString()}`;
      const asset = await get(url, { signal });
      return asset ?? {};
    };

    const getDetails = async () => {
      setLoading(true);
      if (isEmpty(element)) {
        setDetails({});
        return;
      }

      if (isAsset(element)) {
        const assetInfo = await getAssetInformation(element.uri);
        if (signal.aborted) return;

        const details = element.getDetails(assetInfo);
        setDetails(details);
        setLoading(false);
        return;
      }

      try {
        const [dependentInfo, providerInfo] = await Promise.all(
          [element.dependent.uri, element.provider.uri].map(async (assetUri) => {
            const assetInfo = await getAssetInformation(assetUri);
            return assetInfo;
          })
        );
        if (signal.aborted) return;

        const details = element.getDetails(dependentInfo, providerInfo);
        setDetails(details);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
      }
    };

    getDetails();
    return () => {
      controller.abort();
    };
  }, [element, get]);

  if (loading) return <p>Fetching element information</p>;
  if (error) return <p>An error has occured while fetching element information</p>;
  if (isEmpty(details) || isEmpty(element)) return null;

  if (!expand) {
    return (
      <li className="border-b border-whiteSmoke-800">
        <button onClick={onViewDetails} className="text-left pb-3">
          <Details {...details} />
        </button>
      </li>
    );
  }

  return (
    <div id="element-details" className="flex flex-col grow min-h-0 overflow-y-auto gap-y-4 pt-2">
      <Details expand {...details} />
      <ResidentialInformation
        isAsset={isAsset(element)}
        primaryType={element.primaryType}
        uri={element.uri}
      />
      <ConnectedAssets type="dependent" element={element} />
      <ConnectedAssets type="provider" element={element} />
    </div>
  );
};
export default ElementDetails;

const Details = ({ expand, id, title, criticality, type, desc, icon }) => (
  <div className="grid gap-y-1">
    <div className="flex items-center gap-x-2">
      <span className="w-12 h-12 flex items-center justify-center" style={{ ...icon.style }}>
        {icon?.iconLabel ? (
          <span className="text-whiteSmoke">{icon.iconLabel}</span>
        ) : (
          <span className={icon.icon} />
        )}
      </span>
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        {type && <p className="uppercase text-sm">{lowerCase(getURIFragment(type))}</p>}
        <p>{id}</p>
      </div>
    </div>
    {expand && (
      <>
        {icon?.iconLabel && (
          <p className="flex items-center gap-x-2 px-2 rounded-md bg-yellow-600 text-black-100 w-fit">
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
          className="w-fit float-right flex items-center gap-x-1 text-sm"
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

const DetailsSectionTitle = ({ expand, onToggle, children }) => {
  if (onToggle)
    return (
      <button
        className={classNames(
          "bg-whiteSmoke-900 rounded-lg px-2 flex justify-between items-center py-2",
          {
            "inset-x-4 absolute top-0": expand,
            "w-full": !expand,
          }
        )}
        style={{ zIndex: 5 }}
        onClick={onToggle}
      >
        {children}
        <i
          className={classNames("!text-2xl ml-auto", {
            "ri-arrow-up-s-fill": expand,
            "ri-arrow-down-s-fill": !expand,
          })}
        />
      </button>
    );
  return (
    <div
      className={classNames(
        "bg-whiteSmoke-900 rounded-lg px-2 flex justify-between items-center py-2",
        { "absolute top-0 inset-x-4 z-10 ": expand }
      )}
    >
      {children}
    </div>
  );
};

const DetailsSection = ({ expand, show, onToggle, title, children }) => {
  if (!show) return null;

  if (!expand) {
    return (
      <DetailsSectionTitle expand={expand} onToggle={onToggle}>
        <h3 className="text-lg pl-2">{title}</h3>
      </DetailsSectionTitle>
    );
  }

  return (
    <div className="relative mb-5">
      <DetailsSectionTitle expand={expand} onToggle={onToggle}>
        <h3 className="text-lg pl-2">{title}</h3>
      </DetailsSectionTitle>
      {expand && (
        <div className="relative top-5 bg-black-100 rounded-xl w-full p-4 pt-10">{children}</div>
      )}
    </div>
  );
};

const AssetIcon = ({ backgroundColor, color, icon, iconLabel }) => (
  <div
    style={{
      backgroundColor: backgroundColor ?? "#A3A3A3",
      color: color ?? "#333",
    }}
    className="rounded-full w-10 h-10 flex justify-center items-center"
  >
    {icon ? <span className={icon} /> : <span>{iconLabel}</span>}
  </div>
);

const ConnectedAssetListItems = ({ connectedAssets }) => {
  const { assets } = useContext(ElementsContext);

  if (isEmpty(connectedAssets)) return <p>No assets found</p>;
  return connectedAssets
    .sort((a, b) => isElementCached(assets, b.uri) - isElementCached(assets, a.uri))
    .map((asset) => {
      const isAdded = isElementCached(assets, asset.uri);
      const type = getURIFragment(asset.assetType);

      return (
        <li key={asset.uri} className="gap-x-2 bg-black-300 rounded-md p-2 items-center">
          <div className="flex items-center gap-x-2">
            <AssetIcon
              backgroundColor={isAdded ? asset.styles?.backgroundColor : "#A3A3A3"}
              color={isAdded ? asset.styles?.color : "#333"}
              icon={asset.styles?.faIcon}
              iconLabel={type.substring(0, 3)}
            />
            <div>
              <h4>{asset.name}</h4>
              <p className="uppercase" style={{ fontSize: "13px" }}>
                {lowerCase(type)}
              </p>
              <p className="text-sm">{asset.uri.split("#")[1]}</p>
            </div>
          </div>
          <p className="whitespace-nowrap text-sm">
            Criticality: {asset.dependentCriticalitySum || "N/D"}
          </p>
          <p className="whitespace-nowrap text-sm">
            Connection Strength: {asset.connectionStrength || "N/D"}
          </p>
        </li>
      );
    });
};

const ConnectedAssets = ({ type, element }) => {
  const { error, get } = useJSFetch();
  const { getIconStyle } = useOntologyServer();
  const [expand, setExpand] = useLocalStorage(camelCase(`show${type}`), false);
  const [connectedAssets, setConnectedAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const getDependencies = async () => {
      const params = new URLSearchParams({ assetUri: element.uri }).toString();
      const url = `${config.api.url}/asset/${type}s?${params}`;
      const dependencies = await get(url, { signal });
      return dependencies ?? [];
    };

    const getAssetInformation = async (uri) => {
      const url = `${config.api.url}/asset?${new URLSearchParams({ assetUri: uri }).toString()}`;
      const asset = await get(url, { signal });
      return asset ?? {};
    };

    const getConnectedAssetInfo = async () => {
      setLoading(true);

      if (isAsset(element)) {
        const dependencies = await getDependencies();
        const assetsInfo = await Promise.all(
          dependencies.map(async (dependency) => {
            const uri = type === "provider" ? dependency.providerNode : dependency.dependentNode;

            const asset = await getAssetInformation(uri);
            const iconStyle = await getIconStyle(asset.assetType);
            return {
              ...asset,
              connectionStrength: dependency.criticalityRating,
              styles: iconStyle,
            };
          })
        );

        if (signal.aborted) return;
        setConnectedAssets(assetsInfo);
        setLoading(false);
        return;
      }

      const connectedAsset = await getAssetInformation(element[type].uri);
      const iconStyle = await getIconStyle(connectedAsset.assetType);

      if (signal.aborted) return;
      setConnectedAssets([
        { ...connectedAsset, connectionStrength: element.criticalityRating, styles: iconStyle },
      ]);
      setLoading(false);
    };

    try {
      getConnectedAssetInfo();
    } catch (error) {
      console.log(error.message);
    }

    return () => {
      controller.abort();
    };
  }, [type, element, get, getIconStyle]);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (loading) {
    return <DetailsSection expand={false} title={`Loading ${type} assets`} show />;
  }

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      title={`${connectedAssets.length} ${type} assets`}
      show
    >
      {error ? (
        <p>Failed to retrieve {type} assets</p>
      ) : (
        <ul className="grid gap-y-3">
          <ConnectedAssetListItems connectedAssets={connectedAssets} />
        </ul>
      )}
    </DetailsSection>
  );
};
