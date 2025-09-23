import ConnectedAssets from "./ConnectedAssets";
import styles from "./elements.module.css";
import { isEmpty } from "@/utils/isEmpty";
import { useDependents, useGroupedAssets } from "@/hooks";

export interface DependentsProps {
  /** Asset URI */
  readonly assetUri: string;
  /** Dependent asset */
  readonly dependent: any;
  /** Is it an asset? */
  readonly isAsset: boolean;
  /** Is it a dependency? */
  readonly isDependency: boolean;
}

function filterDependentsForKnownAssetsOnly(dependents, dependentsAsAssets) {
  const uris = new Set(
    dependentsAsAssets.map((dependentAsAsset) => dependentAsAsset.uri),
  );

  return dependents.filter((d) => uris.has(d.uri));
}

export default function Dependents({
  assetUri,
  dependent,
  isAsset,
  isDependency,
}: DependentsProps) {
  const {
    isLoading,
    isError,
    error,
    data: dependents,
  } = useDependents(isAsset, isDependency, assetUri, dependent);

  const { getDependentAssets } = useGroupedAssets({});
  const dependentsAsAssets = getDependentAssets([{ uri: assetUri }]);

  if (isLoading) {
    return <p className={styles.loadingMessage}>Loading dependent assets</p>;
  }
  if (isError) {
    return <p className={styles.errorMessage}>{error?.message}</p>;
  }
  if (isEmpty(dependents) || isEmpty(dependentsAsAssets.dependentAssets)) {
    return null;
  }

  const filteredDependents = filterDependentsForKnownAssetsOnly(
    dependents,
    dependentsAsAssets.dependentAssets,
  );

  return <ConnectedAssets connectedAssets={filteredDependents} />;
}
