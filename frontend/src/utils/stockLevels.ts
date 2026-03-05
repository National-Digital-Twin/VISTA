// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export type StockLevel = 'low' | 'medium' | 'high';

export const STOCK_LEVEL_COLORS: Record<StockLevel, string> = {
    low: '#FF0C0C',
    medium: '#FF9E42',
    high: '#22C55E',
};

export const getStockLevel = (currentStock: number, maxCapacity: number): StockLevel => {
    if (maxCapacity <= 0) {
        return 'low';
    }
    const percentage = (currentStock / maxCapacity) * 100;
    if (percentage < 20) {
        return 'low';
    }
    if (percentage < 50) {
        return 'medium';
    }
    return 'high';
};

export const getStockColor = (currentStock: number, maxCapacity: number): string => STOCK_LEVEL_COLORS[getStockLevel(currentStock, maxCapacity)];
