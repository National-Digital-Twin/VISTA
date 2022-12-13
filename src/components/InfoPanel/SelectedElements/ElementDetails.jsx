import React, { useContext, useEffect, useRef, useState } from "react";
import useFetch from "use-http";
import { isEmpty } from "lodash";
import classNames from "classnames";

import { ElementsContext } from "context";
import { getShortType, isAsset } from "utils";
import useLocalStorage from "hooks/useLocalStorage";

const ElementDetails = ({ element, expand, onViewDetails }) => {
  const { get, response, error } = useFetch();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const assetUri = isAsset(element) ? element.uri : undefined;

  useEffect(() => {
    const getAssetInformation = async (assetUri) => {
      const assetInfo = await get(`/asset?${new URLSearchParams(assetUri).toString()}`);
      return response.ok && assetInfo;
    };

    const getDetails = async () => {
      setLoading(true);
      if (isEmpty(element)) return;
      if (isAsset(element)) {
        const assetInfo = await getAssetInformation({ assetUri: element.uri });
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

      const dependentInfo = await getAssetInformation({ assetUri: element.dependent.uri });
      const providerInfo = await getAssetInformation({ assetUri: element.provider.uri });
      setDetails({
        title: `${dependentInfo.name} - ${providerInfo.name}`,
        criticality: element.criticality,
        criticalityColor: element.criticalityColor,
        icon: "w-4 h-0.5 bg-white",
      });
      setLoading(false);
    };

    getDetails();
  }, [element, response, get]);

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
      <Dependents assetUri={assetUri} dependent={element.dependent} />
      <Providers assetUri={assetUri} provider={element.provider} />
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

const ConnectedAsset = ({ uri, criticality }) => {
  const assetUri = { assetUri: uri };
  const { data, loading, error } = useFetch(
    `/asset?${new URLSearchParams(assetUri).toString()}`,
    {},
    []
  );

  const { assets } = useContext(ElementsContext);

  if (loading) return <p>fetching element information</p>;
  if (error) return <p>failed to retrieve element information</p>;
  if (isEmpty(data)) return null;

  const existingAsset = assets.find((asset) => asset.uri === data.uri);

  return (
    <li className="gap-x-2 bg-black-300 rounded-md p-2 items-center">
      <div className="flex items-center  gap-x-2">
        <div
          style={{ backgroundColor: existingAsset?.criticalityColor ?? "#A3A3A3" }}
          className="w-2.5 h-2.5 rounded-full"
        />
        <h4 className="truncate w-64">{data.name}</h4>
      </div>
      <p className="text-sm">ID: {data.uri.split("#")[1]}</p>
      <p className="whitespace-nowrap text-sm">Criticality: {data.dependentCriticalitySum}</p>
      <p className="whitespace-nowrap text-sm">Connection Strength: {criticality}</p>
    </li>
  );
};

const Dependents = ({ assetUri, dependent }) => {
  const { get, response, loading, error } = useFetch();
  const [expand, setExpand] = useLocalStorage("showDependents", false);
  const [dependents, setDepependents] = useState([]);

  useEffect(() => {
    const getDependents = async () => {
      const dependents = await get(
        `/asset/dependents?${new URLSearchParams({ assetUri }).toString()}`
      );
      if (response.ok) setDepependents(dependents);
    };

    if (assetUri) {
      getDependents();
      return;
    }

    setDepependents([dependent]);
  }, [assetUri, dependent, response, get]);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  return (
    <DetailsSection
      expand={expand}
      show={!isEmpty(dependents)}
      onToggle={handleToggleSection}
      title={`${dependents.length} Dependent Assets`}
    >
      {loading && <p>loading...</p>}
      {error && <p>Failed to retrieve asset dependents</p>}
      <ul className="grid gap-y-3">
        {dependents.map((dependent) => {
          const uri = dependent?.dependentNode ?? dependent.uri;
          const criticality = dependent?.criticalityRating ?? dependent.criticality;
          return <ConnectedAsset key={uri} uri={uri} criticality={criticality} />;
        })}
      </ul>
    </DetailsSection>
  );
};

const Providers = ({ assetUri, provider }) => {
  const { get, response, loading, error } = useFetch();
  const [expand, setExpand] = useLocalStorage("showProviders", false);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const getProviders = async () => {
      const providers = await get(
        `/asset/providers?${new URLSearchParams({ assetUri }).toString()}`
      );
      if (response.ok) setProviders(providers);
    };

    if (assetUri) {
      getProviders();
      return;
    }

    setProviders([provider]);
  }, [assetUri, provider, response, get]);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      show={!isEmpty(providers)}
      title={`${providers.length} Provider Assets`}
    >
      {loading && <p>loading...</p>}
      {error && <p>Failed to retrieve asset dependents</p>}
      <ul className="grid gap-y-3">
        {providers.map((provider) => {
          const uri = provider?.providerNode ?? provider.uri;
          const criticality = provider?.criticalityRating ?? provider.criticality;
          return <ConnectedAsset key={uri} uri={uri} criticality={criticality} />;
        })}
      </ul>
    </DetailsSection>
  );
};
