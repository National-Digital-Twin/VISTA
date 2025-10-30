import { createParalogEndpoint, fetchOptions } from './utils';

interface Assessment {
    /** Assessment human-readable name */
    name: string;
    /** Total number of items assessed in this CARVER assessment */
    numberOfAssessedItems: number;
    /** Canonical URI of the assessment */
    uri: string;
}

export const fetchAssessments = async (): Promise<Assessment[]> => {
    try {
        const response = await fetch(createParalogEndpoint('assessments'), fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve assessments: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching assessments:', error);
        throw error;
    }
};

export interface AssessmentDependency {
    /** URI of the dependency itself */
    dependencyUri: string;
    /** Name of the dependent node */
    dependentName: string | null;
    /** URI of the dependent node */
    dependentNode: string;
    /** URI of the dependent node's type */
    dependentNodeType: string;
    /** Name of the provider node */
    providerName: string | null;
    /** URI of the provider node */
    providerNode: string;
    /** URI of the provider node's type */
    providerNodeType: string;
    /** OSM ID */
    osmID: string | null;
    /** Criticality rating of the dependency */
    criticalityRating: number;
}

export const fetchAssessmentDependencies = async (types: string[], assessment: string = 'DEFAULT_ASSESSMENT'): Promise<AssessmentDependency[]> => {
    try {
        const body = JSON.stringify({ assessment, types });

        const response = await fetch(createParalogEndpoint('assessments/dependencies'), {
            ...fetchOptions,
            method: 'POST',
            headers: {
                ...fetchOptions.headers,
                'Content-Type': 'application/json',
            },
            body,
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve dependencies for assessment "${assessment}" with types: ${types.join(', ')}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching dependencies for assessment "${assessment}":`, error);
        throw error;
    }
};
