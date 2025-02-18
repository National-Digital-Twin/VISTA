import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { faEye, faMapMarker } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon, IconName } from "@fortawesome/fontawesome-svg-core";
import { capitalize } from "@/utils/capitalize";

import type { Asset } from "@/models";
import type { FoundIcon } from "@/hooks/useFindIcon";

import { fetchAssessments } from "@/api/assessments";
import { useGroupedAssets } from "@/hooks";
import useSharedStore from "@/hooks/useSharedStore";

import ComplexLayerControl from "@/components/ComplexLayerControl";
import useFindIcon from "@/hooks/useFindIcon";
import type { LayerControlProps } from "@/tools/Tool";

function formatAltText(altText: string) {
  return altText.replace(/([A-Z])/g, " $1").trim();
}

export default function AssetLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  const { isError: isErrorAssessments, data: assessmentsData } =
    useSuspenseQuery({
      queryKey: ["assessments"],
      queryFn: fetchAssessments,
    });

  if (isErrorAssessments) {
    return null;
  }

  return (
    <>
      {assessmentsData.map((assessment) => (
        <AssessmentAssetLayerControls
          key={assessment.uri}
          assessment={assessment.uri}
          searchQuery={searchQuery}
        />
      ))}
    </>
  );
}

interface AssessmentAssetLayerControlsProps {
  readonly assessment: string;
  readonly searchQuery: string;
}

function AssessmentAssetLayerControls({
  assessment,
  searchQuery,
}: AssessmentAssetLayerControlsProps) {
  const { isLoading, isError, filteredAssets } = useGroupedAssets({
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

  if (isError || isLoading) {
    return null;
  }

  return (
    <>
      {sortedCategories.map((category) => (
        <AssessmentCategoryLayerControls
          key={category.category}
          category={category.category}
          assets={category.assets}
        />
      ))}
    </>
  );
}

interface AssessmentCategoryLayerControlsProps {
  readonly category: string;
  readonly assets: Asset[];
}

function AssessmentCategoryLayerControls({
  category,
  assets,
}: Readonly<AssessmentCategoryLayerControlsProps>) {
  const selectedAssetTypes = useSharedStore(
    (state) => state.selectedAssetTypes,
  );
  const selectAssetType = useSharedStore((state) => state.selectAssetType);
  const deselectAssetType = useSharedStore((state) => state.deselectAssetType);

  const assetsBySecondaryCategory = useMemo(() => {
    const categoryMap = {} as {
      [category: string]: {
        [type: string]: {
          count: number;
          maxCriticality: number;
          type: string;
          styles: FoundIcon;
        };
      };
    };
    assets.forEach((asset) => {
      const category = asset.secondaryCategory;
      if (!categoryMap[category]) {
        categoryMap[category] = {};
      }
      const type = asset.type;
      if (!categoryMap[category][type]) {
        categoryMap[category][type] = {
          ...asset,
          count: 1,
          maxCriticality: asset.dependent.criticalitySum,
        };
      } else {
        categoryMap[category][type].count += 1;
        if (
          asset.dependent.criticalitySum >
          categoryMap[category][type].maxCriticality
        ) {
          categoryMap[category][type].maxCriticality =
            asset.dependent.criticalitySum;
        }
      }
    });
    return categoryMap;
  }, [assets]);

  const handleSelectAll = useCallback(
    (typeURIs: string[]) => {
      if (typeURIs.some((typeURI) => !selectedAssetTypes[typeURI])) {
        for (const typeURI of typeURIs) {
          if (!selectedAssetTypes[typeURI]) {
            selectAssetType(typeURI);
          }
        }
      } else {
        for (const typeURI of typeURIs) {
          deselectAssetType(typeURI);
        }
      }
    },
    [selectedAssetTypes, deselectAssetType, selectAssetType],
  );

  const handleTypeClick = useCallback(
    (typeURI: string) => {
      if (selectedAssetTypes[typeURI]) {
        deselectAssetType(typeURI);
      } else {
        selectAssetType(typeURI);
      }
    },
    [selectedAssetTypes, deselectAssetType, selectAssetType],
  );

  const representativeTypeURI = useMemo(() => {
    const allTypes = Object.values(assetsBySecondaryCategory).flatMap((types) =>
      Object.values(types),
    );
    allTypes.sort((a, b) => a.count - b.count);
    if (allTypes.length > 0) {
      return allTypes[0].type;
    } else {
      return "";
    }
  }, [assetsBySecondaryCategory]);

  const iconStyles = useFindIcon(representativeTypeURI);
  const fontAwesomeIconName = iconStyles.faIcon
    ?.split(" ")
    .pop()
    ?.replace("fa-", "") as IconName | undefined;

  const hasAvailableFontAwesomeIcon = !!icon({
    prefix: "fas",
    iconName: fontAwesomeIconName,
  });

  return (
    <ComplexLayerControl
      icon={
        hasAvailableFontAwesomeIcon ? ["fas", fontAwesomeIconName] : faMapMarker
      }
      title={category}
    >
      <div className="menu">
        {Object.entries(assetsBySecondaryCategory).map(([category, types]) => (
          <SecondaryCategoryControls
            key={category}
            types={types}
            onClickType={handleTypeClick}
            onClickAll={handleSelectAll}
          />
        ))}
      </div>
    </ComplexLayerControl>
  );
}

interface SecondaryCategoryControlsProps {
  readonly types: {
    [category: string]: {
      count: number;
      maxCriticality: number;
      type: string;
      styles: FoundIcon;
    };
  };

  readonly onClickType: (typeURI: string) => void;
  readonly onClickAll: (typeURIs: string[]) => void;
}

function SecondaryCategoryControls({
  types,
  onClickType,
  onClickAll,
}: SecondaryCategoryControlsProps) {
  const selectedAssetTypes = useSharedStore(
    (state) => state.selectedAssetTypes,
  );

  const allSelected = Object.keys(types).every(
    (type) => selectedAssetTypes[type],
  );

  const selectAll = useCallback(() => {
    onClickAll(Object.keys(types));
  }, [onClickAll, types]);

  return (
    <div>
      <div
        className="menu-item flex items-center"
        data-selected={allSelected}
        onClick={selectAll}
      >
        <span className="text-lg font-bold">Select All</span>
        {allSelected && <FontAwesomeIcon icon={faEye} className="ml-auto" />}
      </div>
      <ul className="flex flex-col">
        {Object.values(types)
          .sort((a, b) => {
            const criticalityDifference = b.maxCriticality - a.maxCriticality;
            if (criticalityDifference !== 0) {
              return criticalityDifference;
            }
            const nameA = formatAltText(a.styles.alt).toUpperCase();
            const nameB = formatAltText(b.styles.alt).toUpperCase();
            return nameA.localeCompare(nameB);
          })
          .map((asset) => (
            <AssetTypeControls
              key={asset.type}
              asset={asset}
              isSelected={selectedAssetTypes[asset.type]}
              onClickType={onClickType}
            />
          ))}
      </ul>
    </div>
  );
}

interface AssetTypeControlsProps {
  readonly asset: {
    count: number;
    maxCriticality: number;
    type: string;
    styles: FoundIcon;
  };

  readonly isSelected: boolean;
  readonly onClickType: (assetType: string) => void;
}

function AssetTypeControls({
  asset,
  onClickType,
  isSelected,
}: AssetTypeControlsProps) {
  const onClick = useCallback(() => {
    onClickType(asset.type);
  }, [onClickType, asset]);

  return (
    <li
      key={asset.type}
      className="menu-item"
      data-selected={isSelected}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span>
          {capitalize(formatAltText(asset.styles.alt))} ({asset.count})
        </span>
        <span className="text-sm">Criticality: {asset.maxCriticality}</span>
      </div>
    </li>
  );
}
