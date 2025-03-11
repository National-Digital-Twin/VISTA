import ConnectedAssets from "./ConnectedAssets";
import DetailsSection from "./DetailsSection";
import styles from "./elements.module.css";
import { isEmpty } from "@/utils/isEmpty";

export interface ProvidersProps {
  isLoading: boolean;
  isError: boolean;
  error: any;
  providers: any;
}

export default function Providers({
  isLoading,
  isError,
  error,
  providers,
}: ProvidersProps) {
  if (isLoading) {
    return <DetailsSection expand={false} title="Loading provider assets" />;
  }
  if (isError) {
    return <p className={styles.errorMessage}>{error.message}</p>;
  }
  if (isEmpty(providers)) {
    return null;
  }

  return <ConnectedAssets connectedAssets={providers} />;
}
