import React, { useContext, useEffect, useRef, useState } from "react";
import { camelCase, capitalize, isEmpty } from "lodash";
import classNames from "classnames";

import config from "config/app-config";
import { ElementsContext } from "context";
import { findAsset, getShortType, isAsset } from "utils";
import { useJSFetch, useLocalStorage } from "hooks";

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

        setDetails({
          title: assetInfo?.name,
          criticality: element.dependent.criticalitySum,
          type: assetInfo?.assetType,
          desc: assetInfo?.desc,
          criticalityColor: element.criticalityColor,
          icon: "w-3 h-3 rounded-full border-2 border-whiteSmoke",
        });
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
        
        setDetails({
          title: `${dependentInfo.name} - ${providerInfo.name}`,
          criticality: element.criticality,
          criticalityColor: element.criticalityColor,
          icon: "w-4 h-0.5 bg-white",
        });
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    getDetails();

    return () => {
      controller.abort();
    }
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
    <div id="element-details" className="flex flex-col grow min-h-0 overflow-y-auto gap-y-4">
      <Details expand {...details} />
      <ConnectedAssets type="dependent" element={element} />
      <ConnectedAssets type="provider" element={element} />
    </div>
  );
};
export default ElementDetails;

const Details = ({ expand, title, criticality, type, desc, criticalityColor, icon }) => (
  <div className="grid gap-y-1">
    <h2 className="text-lg flex gap-x-2 items-center font-medium">
      <span style={{ backgroundColor: criticalityColor }} className={classNames(icon)} />
      {title}
    </h2>
    {type && <p className="uppercase text-sm">{getShortType(type)}</p>}
    {expand && (
      <>
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
    <div className="absolute top-0 inset-x-4 z-10 bg-whiteSmoke-900 rounded-lg px-2 flex justify-between items-center py-2">
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

const ConnectedAssetListItems = ({ connectedAssets }) => {
  const { assets } = useContext(ElementsContext);

  if (isEmpty(connectedAssets)) return <p>No assets found</p>;

  return connectedAssets.map((asset) => {
    const existingAsset = findAsset(assets, asset.uri);
    return (
      <li key={asset.uri} className="gap-x-2 bg-black-300 rounded-md p-2 items-center">
        <div className="flex items-center  gap-x-2">
          <div
            style={{ backgroundColor: existingAsset?.criticalityColor ?? "#A3A3A3" }}
            className="w-2.5 h-2.5 rounded-full"
          />
          <h4 className="truncate w-64">{asset.name}</h4>
        </div>
        <p className="text-sm">ID: {asset.uri.split("#")[1]}</p>
        <p className="whitespace-nowrap text-sm">Criticality: {asset.dependentCriticalitySum}</p>
        <p className="whitespace-nowrap text-sm">Connection Strength: {asset.connectionStrength}</p>
      </li>
    );
  });
};

const ConnectedAssets = ({ type, element }) => {
  const { error, get } = useJSFetch();
  const [expand, setExpand] = useLocalStorage(camelCase(`show${type}`), false);
  const [connectedAssets, setConnectedAssets] = useState([]);
  const [loading, setLoading] = useState(true);

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
            return {
              ...asset,
              connectionStrength: dependency.criticalityRating,
            };
          })
        );

        if (signal.aborted) return;
        setConnectedAssets(assetsInfo);
        setLoading(false);
        return;
      }

      const connectedAsset = await getAssetInformation(element[type].uri);

      if (signal.aborted) return;
      setConnectedAssets([{ ...connectedAsset, connectionStrength: element.criticalityRating }]);
      setLoading(false);
    };

    getConnectedAssetInfo();

    return () => {
      controller.abort();
    };
  }, [type, element, get]);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      title={`${connectedAssets.length} ${capitalize(type)} Assets`}
      show
    >
      {loading && <p>Loading providers</p>}
      {error && <p>Failed to retrieve {type} assets</p>}
      <ul className="grid gap-y-3">
        <ConnectedAssetListItems connectedAssets={connectedAssets} />
      </ul>
    </DetailsSection>
  );
};
