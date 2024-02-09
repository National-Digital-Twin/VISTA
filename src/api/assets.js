import { createParalogEndpoint, fetchOptions } from "./utils";

export const fetchAssetInfo = async (assetUri) => {
  const queryParams = new URLSearchParams({ assetUri }).toString();
  const response = await fetch(createParalogEndpoint(`asset?${queryParams}`), fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to retrieve asset information for ${assetUri}`);
  }
  return response.json();
};

export const fetchAssetParts = async (assetUri) => {
  const queryParams = new URLSearchParams({ assetUri }).toString();
  const response = await fetch(createParalogEndpoint(`asset/parts?${queryParams}`), fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to retrieve asset parts for ${assetUri}`);
  }
  return response.json();
};

export const fetchDependents = async (assetUri) => {
  const queryParams = new URLSearchParams({ assetUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`asset/dependents?${queryParams}`),
    fetchOptions
  );
  if (!response.ok) {
    throw new Error(`Failed to retrieve dependents for ${assetUri}`);
  }
  return response.json();
};

export const fetchProviders = async (assetUri) => {
  const queryParams = new URLSearchParams({ assetUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`asset/providers?${queryParams}`),
    fetchOptions
  );
  if (!response.ok) {
    throw new Error(`Failed to retrieve providers for ${assetUri}`);
  }
  return response.json();
};

export const fetchResidents = async (assetUri) => {
  const queryParams = new URLSearchParams({ assetUri }).toString();
  const response = await fetch(
    createParalogEndpoint(`asset/residents?${queryParams}`),
    fetchOptions
  );
  if (!response.ok) {
    throw new Error(`Failed to retrieve residents for ${assetUri}`);
  }
  return response.json();
};
