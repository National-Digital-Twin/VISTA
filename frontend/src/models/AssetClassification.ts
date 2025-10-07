import { getColorScale } from '@/utils';

export interface AssetClassification {
    id: string;
    priority: number;
    color?: string;
}

export const RoadClassifications: AssetClassification[] = [
    { id: 'Unknown', priority: 0 },
    { id: 'Not Classified', priority: 1 },
    { id: 'Unclassified', priority: 2 },
    { id: 'Classified Unnumbered', priority: 3 },
    { id: 'B Road', priority: 4 },
    { id: 'A Road', priority: 5 },
    { id: 'Motorway', priority: 6 },
];

export const RailwayClassifications: AssetClassification[] = [
    { id: 'Static Museum', priority: 0 },
    { id: 'Amusement', priority: 1 },
    { id: 'Travelling Structure', priority: 2 },
    { id: 'Mineral', priority: 3 },
    { id: 'Funicular', priority: 4 },
    { id: 'Preserved', priority: 5 },
    { id: 'Tram', priority: 6 },
    { id: 'Rapid Transport System', priority: 7 },
    { id: 'Main Line', priority: 8 },
];

export const AssetClassificationsByType: Record<string, AssetClassification[]> = {
    'https://ies.data.gov.uk/ontology/ies4#Road': RoadClassifications,
    'https://ies.data.gov.uk/ontology/ies4#HeavyRailComplex': RailwayClassifications,
};

export function GetColorScaleForAssetClassification(classifications: AssetClassification[]) {
    const max = Math.max(...classifications.map((c) => c.priority));
    const min = Math.min(...classifications.map((c) => c.priority));
    getColorScale(min, max);
}
