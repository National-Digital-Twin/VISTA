export const layers = {
    environmentalStewardshipSchemaAreas: {
        name: 'Environmental Stewardship Schema Areas',
        layerFile: () => import('@/data/environmental-stewardship-schema-areas-esa.json'),
    },
};

export type EnvironmentallySensitiveAreasLayerId = keyof typeof layers;
