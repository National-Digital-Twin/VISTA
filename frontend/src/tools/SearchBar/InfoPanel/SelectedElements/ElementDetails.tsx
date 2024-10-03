import type { CSSProperties } from "react";
import { useState } from "react";
import { noCase } from "change-case";
import { useQuery } from "@tanstack/react-query";
import { StreetView } from "../InfoHeader";
import TypeIcon from "./TypeIcon";
import Dependents from "./Dependents";
import Providers from "./Providers";
import ResidentialInformation from "./ResidentialInformation";
import Residents from "./Residents";
import styles from "./elements.module.css";
import { getURIFragment, isAsset, isDependency } from "@/utils";
import { fetchAssetInfo } from "@/api/combined";
import { isEmpty } from "@/utils/isEmpty";

export interface ElementDefaultsProps {
  /** Element for which we're showing details */
  element: any;
  /** Whether the details should be fully expanded */
  expand?: boolean;
}

export default function ElementDetails({
  element,
  expand,
}: ElementDefaultsProps) {
  const elemIsAsset = isAsset(element);
  const elemIsDependency = isDependency(element);
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

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

  const isLoading =
    assetInfo.isLoading || dependentInfo.isLoading || providerInfo.isLoading;
  const isError =
    assetInfo.isError || dependentInfo.isError || providerInfo.isError;

  if (isLoading) {
    return <p className={styles.loadingMessage}>Fetching element details</p>;
  }
  if (isError) {
    return (
      <p className={styles.errorMessage}>
        An error has occured while fetching information for {element.uri}
      </p>
    );
  }

  let details = undefined;
  if (elemIsAsset) {
    details = element.getDetails(assetInfo.data);
  }
  if (elemIsDependency) {
    details = element.getDetails(
      dependentInfo.data.name,
      providerInfo.data.name,
    );
  }

  if (isEmpty(element) || !details) {
    return (
      <p className={styles.errorMessage}>
        Unable to retrieve details for unknown element or details not found
      </p>
    );
  }

  if (!expand) {
    return (
      <li className={styles.elementDetails}>
        <button
          aria-label={details.title}
          onClick={toggleDropdown}
          className={styles.elementDetailsButton}
        >
          <Details expand={false} details={details} />
        </button>
        {showDropdown && (
          <div className={styles.elementDetailsDropdown}>
            <div className={styles.streetViewContainer}>
              <span className={styles.streetViewLabel}>
                Visit Asset in Street View:
              </span>
              <StreetView latitude={element?.lat} longitude={element?.lng} />
            </div>
            <ResidentialInformation
              isAsset={elemIsAsset}
              primaryType={element.primaryType}
              uri={element.uri}
            />
            <Residents
              isAsset={elemIsAsset}
              assetUri={element.uri}
              primaryType={element.primaryType}
            />
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
        )}
      </li>
    );
  }

  return (
    <div className={styles.elementDetailsContent}>
      <Details expand details={details} />
      <ResidentialInformation
        isAsset={elemIsAsset}
        primaryType={element.primaryType}
        uri={element.uri}
      />
      <Residents
        isAsset={elemIsAsset}
        assetUri={element.uri}
        primaryType={element.primaryType}
      />
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
}

interface DetailsProps {
  expand: boolean;
  details: {
    id: string;
    title: string;
    criticality: number;
    type: string;
    desc: string;
    icon: {
      icon: string;
      style: CSSProperties;
    };
    elementType: string;
  };
}

function Details({ expand, details }: DetailsProps) {
  const { id, title, criticality, type, desc, icon, elementType } = details;

  return (
    <div className={styles.assetDetails}>
      <div className={styles.assetDetailsHeader}>
        {elementType === "asset" ? (
          <TypeIcon size="sm" type={type} />
        ) : (
          <span className={styles.assetIcon} style={{ ...icon.style }} />
        )}
        <div>
          <h2 className={styles.assetDetailsTitle}>{title}</h2>
          {type && (
            <p className={styles.assetDetailsType}>
              {noCase(getURIFragment(type))}
            </p>
          )}
          <p>{id}</p>
        </div>
      </div>
      {expand && (
        <>
          {icon?.icon && (
            <p className={styles.assetDetailsCriticality}>
              <i className="fa-solid fa-triangle-exclamation" />
              Icon styles not found
            </p>
          )}
          <p>Criticality: {criticality}</p>
          <Description description={desc} />
        </>
      )}
    </div>
  );
}

interface DescriptionProps {
  description: string;
}

function Description({ description }: DescriptionProps) {
  if (!description) {
    return null;
  }

  return (
    <div>
      <p>{description}</p>
    </div>
  );
}
