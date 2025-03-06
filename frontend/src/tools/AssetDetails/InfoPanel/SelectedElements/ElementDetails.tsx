import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { noCase } from "change-case";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { faStreetView, faArrowRight } from "@fortawesome/free-solid-svg-icons";
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
  readonly element: any;
  readonly expand?: boolean;
}

export default function ElementDetails({ element, expand }: Readonly<ElementDefaultsProps>) {
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

  const isLoading = assetInfo.isLoading || dependentInfo.isLoading || providerInfo.isLoading;
  const isError = assetInfo.isError || dependentInfo.isError || providerInfo.isError;

  if (isLoading) {
    return <Typography className={styles.loadingMessage}>Fetching element details...</Typography>;
  }
  if (isError) {
    return (
      <Typography className={styles.errorMessage}>
        An error occurred while fetching information for {element.uri}
      </Typography>
    );
  }

  let details = undefined;
  if (elemIsAsset) {
    details = element.getDetails(assetInfo.data);
  }
  if (elemIsDependency) {
    details = element.getDetails(dependentInfo.data.name, providerInfo.data.name);
  }

  if (isEmpty(element) || !details) {
    return (
      <Typography className={styles.errorMessage}>
        Unable to retrieve details for unknown element or details not found.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
      {/* Asset Details */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Details expand details={details} />
        </CardContent>
      </Card>

      {/* Street View Integration */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FontAwesomeIcon icon={faStreetView} style={{ color: "#1976d2" }} />
            <Typography variant="body2">Google Street View</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={() => toggleDropdown()}
            >
              View
            </Button>
            <Button
              component="a"
              href={`https://www.google.com/maps?q=${element?.lat},${element?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="primary"
              size="small"
              sx={{ textTransform: "none" }}
              endIcon={<FontAwesomeIcon icon={faArrowRight} />}
            >
              Open
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Expandable Section */}
      {expand ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ResidentialInformation isAsset={elemIsAsset} primaryType={element.primaryType} uri={element.uri} />
          <Residents isAsset={elemIsAsset} assetUri={element.uri} primaryType={element.primaryType} />
          <Dependents isAsset={elemIsAsset} isDependency={elemIsDependency} assetUri={element.uri} dependent={element?.dependent} />
          <Providers isAsset={elemIsAsset} isDependency={elemIsDependency} assetUri={element.uri} provider={element?.provider} />
        </Box>
      ) : null}
    </Box>
  );
}

interface DetailsProps {
  readonly expand: boolean;
  readonly details: {
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

function Details({ expand, details }: Readonly<DetailsProps>) {
  const { id, title, criticality, type, desc, icon, elementType } = details;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {elementType === "asset" ? <TypeIcon size="sm" type={type} /> : <span className={styles.assetIcon} style={{ ...icon.style }} />}
        <Box>
          <Typography variant="h6">{title}</Typography>
          {type && <Typography variant="body2">{noCase(getURIFragment(type))}</Typography>}
          <Typography variant="body2">{id}</Typography>
        </Box>
      </Box>

      {expand && (
        <>
          {icon?.icon && (
            <Typography variant="body2">
              <i className="fa-solid fa-triangle-exclamation" /> Icon styles not found
            </Typography>
          )}
          <Typography variant="body2">Criticality: {criticality}</Typography>
          <Description description={desc} />
        </>
      )}
    </Box>
  );
}

interface DescriptionProps {
  readonly description: string;
}

function Description({ description }: DescriptionProps) {
  if (!description) {
    return null;
  }

  return (
    <Box>
      <Typography variant="body2">{description}</Typography>
    </Box>
  );
}
