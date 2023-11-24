import { createParalogEndpoint, fetchOptions } from "./utils";

export const fetchAssessments = async () => {
  const response = await fetch(
    createParalogEndpoint("assessments"),
    fetchOptions
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve assessments`);
  }

  return response.json();
};

export const fetchAssetTypes = async (assessment) => {
  const queryParams = new URLSearchParams({ assessment }).toString();
  const response = await fetch(
    createParalogEndpoint(`assessments/asset-types?${queryParams}`),
    fetchOptions
  );

  if (!response.ok) {
    throw new Error(
      `An error occured while retrieving data types for ${assessment}`
    );
  }

  return response.json();
};

export const fetchAssessmentAssets = async (assessment, types) => {
  const typeParams = types.map((type) => ["types", type]);
  const queryParams = new URLSearchParams([
    ["assessment", assessment],
    ...typeParams,
  ]).toString();

  const response = await fetch(
    createParalogEndpoint(`assessments/assets?${queryParams}`),
    fetchOptions
  );

  if (!response.ok) {
    throw new Error(
      `An error occured while retrieving assets for assessment ${assessment} and types ${types.toString()}`
    );
  }

  return response.json();
};

export const fetchAssessmentDependencies = async (assessment, types) => {
  const typeParams = types.map((type) => ["types", type]);
  const queryParams = new URLSearchParams([
    ["assessment", assessment],
    ...typeParams,
  ]).toString();

  const response = await fetch(
    createParalogEndpoint(`assessments/dependencies?${queryParams}`),
    fetchOptions
  );

  if (!response.ok) {
    throw new Error(
      `An error occured while retrieving dependencies for assessment ${assessment} and types ${typeParams.toString()}`
    );
  }

  return response.json();
};
