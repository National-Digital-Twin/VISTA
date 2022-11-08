import React, { useEffect, useRef, useState } from "react";
import { getShortType, isAsset, IsEmpty } from "../../utils";
import classNames from "classnames";

const ElementDetails = ({ element, expand, onViewDetails }) => {
  if (IsEmpty(element)) return null;

  if (!expand)
    return (
      <li className="border-b border-whiteSmoke-800">
        <button onClick={onViewDetails} className="text-left pb-3">
          <Details element={element} />
        </button>
      </li>
    );

  return (
    <div id="element-details" className="grid grid-flow-row auto-rows-min gap-y-4">
      <Details element={element} expand />
      <ConnectedAssets connectedAssets={element.connectedAssets} />
    </div>
  );
};

const Details = ({ element, expand }) => (
  <div className="grid gap-y-1">
    <h2 className="text-lg flex gap-x-2 items-center font-medium">
      <span
        style={{ backgroundColor: element.color }}
        className={classNames({
          "w-3 h-3 rounded-full border-2 border-whiteSmoke": isAsset(element),
          "w-4 h-0.5 bg-white": !isAsset(element),
        })}
      />
      {element.title}
    </h2>
    {element.type && <p className="uppercase text-sm">{getShortType(element.type)}</p>}
    {expand && (
      <>
        <p>Criticality: {element.criticality}</p>
        <Description description={element.description} />
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
        <button className="w-fit float-right flex items-center gap-x-1 text-sm" onClick={handleShowMore}>
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
          "absolute top-0 z-10 bg-whiteSmoke-900 rounded-lg px-2 flex justify-between items-center py-2",
          { "inset-x-4": expand, "inset-x-0": !expand }
        )}
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

  return (
    <div className="relative mb-5">
      <DetailsSectionTitle expand={expand} onToggle={onToggle}>
        <h3 className="text-lg pl-2">{title}</h3>
      </DetailsSectionTitle>
      {expand && <div className="relative top-5 bg-black-100 rounded-xl w-full p-4 pt-10">{children}</div>}
    </div>
  );
};

const ConnectedAssets = ({ connectedAssets }) => {
  const [expand, setExpand] = useState(true);

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
            <li key={asset.uri} className="gap-x-2 bg-black-400 rounded-md p-2 items-center">
              <div className="flex items-center  gap-x-2">
                <div style={{ backgroundColor: asset.color }} className="w-2.5 h-2.5 rounded-full" />
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
