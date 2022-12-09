import React, { useEffect, useRef, useState } from "react";
import { getShortType, isAsset, IsEmpty } from "../../utils";
import classNames from "classnames";
import useLocalStorage from "../../hooks/useLocalStorage";
import useFetch from "use-http";
import { isEmpty } from "lodash";

const ElementDetails = ({ element, expand, onViewDetails }) => {
  const { get, response, loading, error } = useFetch();
  const [elementInfo, setElementInfo] = useState(undefined);

  // useEffect(() => {
  //   // if (isEmpty(element)) return;

  //   const getAssetInfo = async () => {
  //     const assetUri = { assetUri: element.uri }
  //     const assetInfo = await get(`/asset?${new URLSearchParams(assetUri).toString()}`)
  //     if (response.ok) setElementInfo(assetInfo);
  //   }
  //   if (expand) {
  //     getAssetInfo();
  //   }
  // }, [expand, response, get])

  // if (IsEmpty(elementInfo)) return null;

  if (!expand)
    return (
      <li className="border-b border-whiteSmoke-800">
        <button onClick={onViewDetails} className="text-left pb-3">
          <Details element={element} />
        </button>
      </li>
    );

  console.log(element);

  // const getAssetInfo = async () => {
  //   const assetUri = { assetUri: element.uri };
  //   const assetInfo = await get(`/asset?${new URLSearchParams(assetUri).toString()}`);
  //   if (response.ok) setElementInfo(assetInfo);
  // };
  // if (expand) {
  //   getAssetInfo();
  // }

  return (
    <div id="element-details" className="flex flex-col grow min-h-0 overflow-y-auto gap-y-4">
      <Details element={element} info={elementInfo} expand />
      {/* <ConnectedAssets connectedAssets={element.connectedAssets} /> */}
    </div>
  );
};

const Details = ({ element, info, expand }) => (
  <div className="grid gap-y-1">
    <h2 className="text-lg flex gap-x-2 items-center font-medium">
      <span
        style={{ backgroundColor: element.criticalityColor }}
        className={classNames({
          "w-3 h-3 rounded-full border-2 border-whiteSmoke": isAsset(element),
          "w-4 h-0.5 bg-white": !isAsset(element),
        })}
      />
      {info?.name}
    </h2>
    {info?.assetType && <p className="uppercase text-sm">{getShortType(info.assetType)}</p>}
    {expand && (
      <>
        <p>Criticality: {element.dependent.criticalitySum}</p>
        <Description description={info?.desc} />
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

const DetailsSection = ({ expand, onToggle, show, title, children }) => {
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

const ConnectedAssets = ({ connectedAssets }) => {
  const [expand, setExpand] = useLocalStorage("showConnectedAssets", true);

  const handleToggleSection = () => {
    setExpand((prev) => !prev);
  };

  return (
    <DetailsSection
      expand={expand}
      onToggle={handleToggleSection}
      show={!IsEmpty(connectedAssets)}
      title={`${connectedAssets.length} Connected Assets`}
    >
      <ul className="grid gap-y-3">
        {connectedAssets.map((asset) => {
          return (
            <li key={asset.uri} className="gap-x-2 bg-black-300 rounded-md p-2 items-center">
              <div className="flex items-center  gap-x-2">
                <div
                  style={{ backgroundColor: asset.color }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <h4 className="truncate w-64" title={asset.title}>
                  {asset.title}
                </h4>
              </div>

              <p className="whitespace-nowrap">Asset criticality: {asset.assetCriticality}</p>
              <p className="whitespace-nowrap">Connection criticality: {asset.cxnCriticality}</p>
            </li>
          );
        })}
      </ul>
    </DetailsSection>
  );
};

export default ElementDetails;
