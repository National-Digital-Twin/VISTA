import { useMemo } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import useStore from '@/hooks/useSharedStore';
import { capitalize } from '@/utils/capitalize';
import type { Asset } from '@/models';
import type { FoundIcon } from '@/hooks/useFindIcon';

const formatAltText = (altText: string) => {
    return altText.replace(/([A-Z])/g, ' $1').trim();
};

export interface GroupedTypesProps {
    /** Whether the group is expanded */
    readonly expand: boolean;
    /** Assets in the group */
    readonly assets: Asset[];
    /** Additional classes to add to the top-level element */
    readonly className?: string;
}

export default function GroupedTypes({ expand, assets, className }: GroupedTypesProps) {
    const selectedAssetTypes = useStore((state) => state.selectedAssetTypes);
    const selectAssetType = useStore((state) => state.selectAssetType);
    const deselectAssetType = useStore((state) => state.deselectAssetType);

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
                if (asset.dependent.criticalitySum > categoryMap[category][type].maxCriticality) {
                    categoryMap[category][type].maxCriticality = asset.dependent.criticalitySum;
                }
            }
        });
        return categoryMap;
    }, [assets]);

    const handleTypeClick = (type: string) => {
        if (selectedAssetTypes[type]) {
            deselectAssetType(type);
        } else {
            selectAssetType(type);
        }
    };

    const handleCategoryClick = (category: string) => {
        const types = Object.keys(assetsBySecondaryCategory[category]);
        const allSelected = types.every((type) => selectedAssetTypes[type]);
        types.forEach((type) => {
            if (allSelected) {
                deselectAssetType(type);
            } else {
                selectAssetType(type);
            }
        });
    };

    if (!expand) {
        return null;
    }

    return (
        <div className={classNames('flex flex-col gap-y-4', className)}>
            {Object.entries(assetsBySecondaryCategory).map(([category, types]) => {
                const allSelected = Object.keys(types).every((type) => selectedAssetTypes[type]);

                return (
                    <div key={category}>
                        <div className="menu-item flex items-center" data-selected={allSelected} onClick={() => handleCategoryClick(category)}>
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
                                    <li
                                        key={asset.type}
                                        className="menu-item"
                                        data-selected={selectedAssetTypes[asset.type]}
                                        onClick={() => handleTypeClick(asset.type)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>
                                                {capitalize(formatAltText(asset.styles.alt))} ({asset.count})
                                            </span>
                                            <span className="text-sm">Criticality: {asset.maxCriticality}</span>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
