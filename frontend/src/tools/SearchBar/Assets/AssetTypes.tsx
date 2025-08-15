import { useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronUp,
  faChevronDown,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import GroupedTypes from "./GroupedTypes";
import { capitalize } from "@/utils/capitalize";
import { useGroupedAssets } from "@/hooks";
import useStore from "@/hooks/useSharedStore";
import type { Asset } from "@/models";

export interface AssetTypesProps {
  /** Assessment from which we're drawing analysis */
  readonly assessment: string;
  /** Search query into assets */
  readonly searchQuery: string;
}

export default function AssetTypes({
  assessment,
  searchQuery,
}: AssetTypesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {
    isLoadingDependencies: isLoading,
    isDependenciesError: isError,
    dependenciesError: error,
    filteredAssets,
  } = useGroupedAssets({
    assessment,
    searchFilter: searchQuery,
  });

  const sortedCategories = useMemo(() => {
    const categoriesWithCriticality = (filteredAssets || []).reduce(
      (acc, asset) => {
        const { secondaryCategory } = asset;
        if (!acc[secondaryCategory]) {
          acc[secondaryCategory] = {
            category: secondaryCategory,
            totalCriticality: 0,
            assets: [],
          };
        }
        acc[secondaryCategory].totalCriticality +=
          asset.dependent.criticalitySum;
        acc[secondaryCategory].assets.push(asset);
        return acc;
      },
      {} as {
        [category: string]: {
          category: string;
          totalCriticality: number;
          assets: Asset[];
        };
      },
    );

    return Object.values(categoriesWithCriticality).sort(
      (a, b) => b.totalCriticality - a.totalCriticality,
    );
  }, [filteredAssets]);

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory((selectedCategory) =>
      selectedCategory === category ? null : category,
    );
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (isError || !filteredAssets) {
    return <p>Error: {error ? error.message : "No data found"}</p>;
  }

  return (
    <div className="menu menu-lg overflow-y-auto">
      {sortedCategories.map(({ category, assets }) => {
        return (
          <AssetTypeCategory
            key={category}
            category={category}
            assets={assets}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />
        );
      })}
    </div>
  );
}

interface AssetTypeCategoryProps {
  readonly category: string;
  readonly selectedCategory?: string;
  readonly assets: Asset[];
  readonly onCategoryClick: (category: string) => void;
}

function AssetTypeCategory({
  category,
  selectedCategory,
  assets,
  onCategoryClick,
}: AssetTypeCategoryProps) {
  const selectedAssetTypes = useStore((state) => state.selectedAssetTypes);

  const isCategoryActive = assets.some(
    (asset) => selectedAssetTypes[asset.type],
  );

  const isCategorySelected = selectedCategory === category;

  const onClick = useCallback(() => {
    onCategoryClick(category);
  }, [onCategoryClick, category]);

  return (
    <>
      <div
        className="menu-item flex items-center gap-2"
        data-selected={isCategorySelected}
        onClick={onClick}
      >
        <div className="flex items-center">
          {capitalize(category)} ({assets.length})
        </div>
        <FontAwesomeIcon
          icon={isCategorySelected ? faChevronDown : faChevronUp}
        />
        {isCategoryActive && (
          <FontAwesomeIcon icon={faEye} className="ml-auto" />
        )}
      </div>
      {isCategorySelected && (
        <GroupedTypes expand={true} assets={assets} className="mt-2" />
      )}
    </>
  );
}
