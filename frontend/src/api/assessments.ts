import { createParalogEndpoint, fetchOptions } from "./utils";
import fetchWithAuth from "@/auth/fetchAuth";

interface Assessment {
  /** Assessment human-readable name */
  name: string;
  /** Total number of items assessed in this CARVER assessment */
  numberOfAssessedItems: number;
  /** Canonical URI of the assessment */
  uri: string;
}

export const fetchAssessments = async () => {
  const response = await fetchWithAuth(
    createParalogEndpoint("assessments"),
    fetchOptions,
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve assessments`);
  }

  return (await response.json()) as Assessment[];
};

interface AssessmentDependency {
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

export const fetchAssessmentDependencies = async (
  assessment: string,
  types: string[],
) => {
  const body = JSON.stringify({ assessment, types });

  const response = await fetchWithAuth(
    createParalogEndpoint(`assessments/dependencies`),
    {
      ...fetchOptions,
      method: "POST",
      headers: {
        ...fetchOptions.headers,
        "Content-Type": "application/json",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(
      `An error occurred while retrieving dependencies for assessment ${assessment} and types ${types.toString()}`,
    );
  }

  return (await response.json()) as AssessmentDependency[];
};
