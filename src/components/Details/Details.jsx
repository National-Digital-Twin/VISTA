import React, { useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { getShortType, isAsset, IsEmpty } from "../../utils";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { ElementsContext } from "../../ElementsContext";
import classNames from "classnames";
import "./Details.css";

const Details = () => {
  const { selectedDetails } = useContext(ElementsContext);

  if (IsEmpty(selectedDetails))
    return <p className="">Click on an asset or connection to view details</p>;

  if (selectedDetails.length > 1) {
    return (
      <div>
        {selectedDetails.map((selectedElement) => (
          <p key={selectedElement.id}>{selectedElement.id}</p>
        ))}
      </div>
    );
  }

  const selected = selectedDetails[0];

  return (
    <div className="grid grid-flow-row auto-rows-min gap-y-4 overflow-auto">
      <div className="flex justify-end">
        <StreetView latitude={selected.lat} longitude={selected.lng} />
      </div>
      <div className="grid gap-y-1">
        <h2 className="text-xl flex gap-x-2 items-center font-medium">
          <span
            style={{
              backgroundColor: selected.color,
            }}
            className={classNames({
              "w-3 h-3 rounded-full border-2 border-whiteSmoke": isAsset(selected),
              "w-4 h-0.5 bg-white": !isAsset(selected),
            })}
          />
          {selected.title}
        </h2>
        {selected.type && <p className="uppercase text-sm">{getShortType(selected.type)}</p>}
        <p>Criticality: {selected.criticality}</p>
        <Description desc={selected.description} />
      </div>
      <ConnectedAssets connectedAssets={selected.connectedAssets} />
    </div>
  );
};
export default Details;

const StreetView = ({ latitude, longitude }) => {
  if (!latitude && !longitude) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div className="w-fit flex items-center justify-center gap-x-1">
      <GoogleMapIcon />
      <div>
        <a
          href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          Open street view
        </a>
        <div className="linkBorder" />
      </div>
    </div>
  );
};

StreetView.defaultProps = {
  latitude: undefined,
  longitude: undefined,
};

StreetView.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
};

const Description = ({ desc }) => {
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

  if (!desc) return null;

  const handleShowMore = () => {
    setShowMore((show) => !show);
  };

  return (
    <div>
      <p ref={descRef} className={classNames({ "line-clamp": showMore })}>
        {desc}
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
      {expand && (
        <div className="relative top-5 bg-black-200 rounded-xl w-full p-4 pt-10">{children}</div>
      )}
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
            <li
              key={asset.uri}
              className="grid grid-flow-col auto-cols-min gap-x-2 bg-black-400 rounded-md p-2 items-center"
            >
              <div style={{ backgroundColor: asset.color }} className="w-2.5 h-2.5 rounded-full" />
              <div className="grid grid-rows-2">
                <h4 className="flex gap-x-2 items-center whitespace-nowrap">{asset.title}</h4>
                <div className="grid grid-flow-col auto-cols-min gap-x-6">
                  <p className="whitespace-nowrap">Asset criticality: {asset.assetCriticality}</p>
                  <p className="whitespace-nowrap">
                    Connection Criticality: {asset.cxnCriticality}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </DetailsSection>
  );
};
