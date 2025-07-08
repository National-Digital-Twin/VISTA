import { useQuery } from "@tanstack/react-query";
import { noCase } from "change-case";
import { getURIFragment, isAsset } from "@/utils";
import { fetchAssetInfo } from "@/api/combined";

export interface InfoTooltipProps {
  /** Map element for which this is the tooltip */
  readonly element: any;
}

export default function InfoTooltip({ element }: InfoTooltipProps) {
  const elemIsAsset = isAsset(element);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asset-info", element?.uri],
    queryFn: () => fetchAssetInfo(element?.uri),
    enabled: elemIsAsset,
  });

  if (!element) {
    return <p>No element provided</p>;
  }

  if (isLoading) {
    return <p>Fetching element details...</p>;
  }

  if (isError) {
    return (
      <p>An error occurred while fetching information for {element.uri}</p>
    );
  }

  const details = elemIsAsset ? element.getDetails(data) : element.getDetails();

  if (!details) {
    return <p>Unable to retrieve details for the element</p>;
  }

  return <Details details={details} />;
}

interface DetailsProps {
  readonly details: {
    id: string;
    title: string;
    type: string;
    desc: string;
  };
}

function Details({ details }: DetailsProps) {
  const { id, title, type, desc } = details;

  return (
    <div
      className="grid gap-y-1 menu py-1 px-3"
      style={{
        width: "fit-content",
        maxWidth: "30rem",
        minWidth: "10rem",
      }}
    >
      <h2 className="text-lg">{title}</h2>
      {type && (
        <p className="text-sm uppercase">{noCase(getURIFragment(type))}</p>
      )}
      <p>{id}</p>
      {desc && <p>{desc}</p>}
    </div>
  );
}
