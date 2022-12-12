import React, { useContext, useEffect, useRef, useState } from "react";
import useFetch from "use-http";
import { isEmpty } from "lodash";
import classNames from "classnames";

import { getShortType, isAsset } from "utils";
import useLocalStorage from "hooks/useLocalStorage";
import { ElementsContext } from "context";

const ElementDetails = (props) =>
  isAsset(props.element) ? <AssetDetails {...props} /> : <DependencyDetails {...props} />;
export default ElementDetails;

const AssetDetails = ({ element, expand, onViewDetails }) => {
  const assetUri = { assetUri: element?.uri };
  const { data, loading, error } = useFetch(
    `/asset?${new URLSearchParams(assetUri).toString()}`,
    {},
    []
  );

  if (loading) return <p>Fetching element information</p>;
  if (error) return <p>An error has occured while fetching element information</p>;
  if (isEmpty(data)) return null;

  const details = {
    title: data?.name,
    criticality: element.dependent.criticalitySum,
    type: data?.assetType,
    desc: data?.desc,
    criticalityColor: element.criticalityColor,
    icon: "w-3 h-3 rounded-full border-2 border-whiteSmoke",
  };

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
      <Dependents assetUri={assetUri} />
      <Providers assetUri={assetUri} />
    </div>
  );
};

const DependencyDetails = ({ element, expand, onViewDetails }) => {
  const { get, response, loading, error } = useFetch();
  const [dependentInfo, setDependentInfo] = useState({});
  const [providerInfo, setProviderInfo] = useState({});

  useEffect(() => {
    const getDependent = async () => {
      const assetUri = { assetUri: element.dependent.uri };
      const dependent = await get(`/asset?${new URLSearchParams(assetUri).toString()}`);
      response.ok ? setDependentInfo(dependent) : setDependentInfo({});
    };

    const getProvider = async () => {
      const assetUri = { assetUri: element.provider.uri };
      const provider = await get(`/asset?${new URLSearchParams(assetUri).toString()}`);
      response.ok ? setProviderInfo(provider) : setProviderInfo({});
    };

    getDependent();
    getProvider();
  }, [response, get]);

  if (isEmpty(dependentInfo) || isEmpty(providerInfo)) return null;

  const details = {
    title: `${dependentInfo.name} - ${providerInfo.name}`,
    criticalityColor: element.criticalityColor,
    icon: "w-4 h-0.5 bg-white",
    criticality: element.criticality,
  };

  console.log(dependentInfo);

  if (!expand) {
    return (
      <li className="border-b border-whiteSmoke-800">
        <button onClick={onViewDetails} className="text-left pb-3">
          <Details element={element} {...details} />
        </button>
      </li>
    );
  }

  return (
    <div id="depedency-details" className="flex flex-col grow min-h-0 overflow-y-auto gap-y-4">
      <Details element={element} {...details} expand />
      <DependencyDependent uri={element.dependent.uri} criticality={details.criticality} />
      <DependencyProvider uri={element.provider.uri} criticality={details.criticality} />
    </div>
  );
};

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

const DetailsSection = ({ expand, onToggle, title, children }) => {
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
      <p>
        <b>ID:</b> {data.uri.split("#")[1]}
      </p>
      <p className="whitespace-nowrap">Asset criticality: tbh</p>
      <p className="whitespace-nowrap">Dependency Criticality: {criticality}</p>
    </li>
  );
};

const Dependents = ({ assetUri }) => {
  const { data, loading, error } = useFetch(
    `/asset/dependents?${new URLSearchParams(assetUri).toString()}`,
    {},
    [assetUri]
  );
  const [expand, setExpand] = useLocalStorage("showDependents", false);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isEmpty(data)) return null;

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      show={!isEmpty(data)}
      title={`${data.length} Dependent Assets`}
    >
      {loading && <p>loading...</p>}
      {error && <p>Failed to retrieve asset dependents</p>}
      <ul className="grid gap-y-3">
        {data.map((dependency) => (
          <ConnectedAsset
            key={dependency.dependencyUri}
            uri={dependency.dependentNode}
            criticality={dependency.criticalityRating}
          />
        ))}
      </ul>
    </DetailsSection>
  );
};

const Providers = ({ assetUri }) => {
  const { data, loading, error } = useFetch(
    `/asset/providers?${new URLSearchParams(assetUri).toString()}`,
    {},
    [assetUri]
  );
  const [expand, setExpand] = useLocalStorage("showProviders", false);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (isEmpty(data)) return null;

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      title={`${data.length} Provider Assets`}
    >
      {loading && <p>loading...</p>}
      {error && <p>Failed to retrieve asset dependents</p>}
      <ul className="grid gap-y-3">
        {data.map((dependency) => (
          <ConnectedAsset
            key={dependency.dependencyUri}
            uri={dependency.providerNode}
            criticality={dependency.criticalityRating}
          />
        ))}
      </ul>
    </DetailsSection>
  );
};

const DependencyDependent = ({ uri , criticality }) => {
  const [expand, setExpand] = useLocalStorage("showDependents", false);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (!uri) return null;

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      title={`1 Dependent Asset`}
    >
      {/* {loading && <p>loading...</p>} */}
      {/* {error && <p>Failed to retrieve asset dependents</p>} */}
      <ul className="grid gap-y-3">
        {/* {data.map((dependency) => ( */}
          <ConnectedAsset
            // key={dependency.dependencyUri}
            uri={uri}
            criticality={criticality}
          />
        {/* ))} */}
      </ul>
    </DetailsSection>
  );
};

const DependencyProvider = ({ uri , criticality }) => {
  const [expand, setExpand] = useLocalStorage("showProviders", false);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  if (!uri) return null;

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      title={`1 Provider Asset`}
    >
      {/* {loading && <p>loading...</p>} */}
      {/* {error && <p>Failed to retrieve asset dependents</p>} */}
      <ul className="grid gap-y-3">
        {/* {data.map((dependency) => ( */}
          <ConnectedAsset
            // key={dependency.dependencyUri}
            uri={uri}
            criticality={criticality}
          />
        {/* ))} */}
      </ul>
    </DetailsSection>
  );
};
