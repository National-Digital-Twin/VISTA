// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect } from 'vitest';
import { getAssetTypeName } from './getAssetTypeName';
import type { AssetCategory } from '@/api/asset-categories';

describe('getAssetTypeName', () => {
    const mockAssetCategories: AssetCategory[] = [
        {
            id: 'cat1',
            name: 'Healthcare',
            subCategories: [
                {
                    id: 'subcat1',
                    name: 'Healthcare Facilities',
                    assetTypes: [
                        {
                            id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                            name: 'Hospital',
                        },
                        {
                            id: '72108cc2-8b57-4b88-85b2-1fd676936106',
                            name: 'Clinic',
                        },
                    ],
                },
                {
                    id: 'subcat2',
                    name: 'Emergency Services',
                    assetTypes: [
                        {
                            id: '64c6ae5f-acb8-4ab4-9711-ea256236ab68',
                            name: 'Ambulance Station',
                        },
                    ],
                },
            ],
        },
        {
            id: 'cat2',
            name: 'Infrastructure',
            subCategories: [
                {
                    id: 'subcat3',
                    name: 'Transport',
                    assetTypes: [
                        {
                            id: 'd878def3-854b-4ae5-9e8d-398863a7d356',
                            name: 'Bridge',
                        },
                    ],
                },
            ],
        },
    ];

    describe('when assetCategories is provided', () => {
        it('returns the asset type name when found in first category', () => {
            const result = getAssetTypeName('35a910f3-f611-4096-ac0b-0928c5612e32', mockAssetCategories);
            expect(result).toBe('Hospital');
        });

        it('returns the asset type name when found in second subcategory', () => {
            const result = getAssetTypeName('64c6ae5f-acb8-4ab4-9711-ea256236ab68', mockAssetCategories);
            expect(result).toBe('Ambulance Station');
        });

        it('returns the asset type name when found in second category', () => {
            const result = getAssetTypeName('d878def3-854b-4ae5-9e8d-398863a7d356', mockAssetCategories);
            expect(result).toBe('Bridge');
        });

        it('returns null when type ID is not found', () => {
            const result = getAssetTypeName('unknown-type-id', mockAssetCategories);
            expect(result).toBeNull();
        });
    });

    describe('when assetCategories is not provided', () => {
        it('returns null', () => {
            const result = getAssetTypeName('35a910f3-f611-4096-ac0b-0928c5612e32');
            expect(result).toBeNull();
        });
    });

    describe('when assetCategories is empty array', () => {
        it('returns null', () => {
            const result = getAssetTypeName('35a910f3-f611-4096-ac0b-0928c5612e32', []);
            expect(result).toBeNull();
        });
    });

    describe('edge cases', () => {
        it('handles empty subCategories array', () => {
            const emptyCategories: AssetCategory[] = [
                {
                    id: 'cat1',
                    name: 'Empty Category',
                    subCategories: [],
                },
            ];
            const result = getAssetTypeName('35a910f3-f611-4096-ac0b-0928c5612e32', emptyCategories);
            expect(result).toBeNull();
        });

        it('handles empty assetTypes array', () => {
            const emptyAssetTypes: AssetCategory[] = [
                {
                    id: 'cat1',
                    name: 'Category',
                    subCategories: [
                        {
                            id: 'subcat1',
                            name: 'Subcategory',
                            assetTypes: [],
                        },
                    ],
                },
            ];
            const result = getAssetTypeName('35a910f3-f611-4096-ac0b-0928c5612e32', emptyAssetTypes);
            expect(result).toBeNull();
        });

        it('handles empty string typeId', () => {
            const result = getAssetTypeName('', mockAssetCategories);
            expect(result).toBeNull();
        });
    });
});
