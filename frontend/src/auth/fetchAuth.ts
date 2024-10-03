/** Fetch with authentication if needed */
import provider from "./provider";

type FetchOptions = Parameters<typeof fetch>[1];

function getBearerToken(): string | null {
  return provider.bearerToken();
}

export default async function fetchWithAuth(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  const bearerToken = getBearerToken();

  if (bearerToken !== null) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const updatedOptions: FetchOptions = {
    ...options,
    headers,
  };

  return fetch(url, updatedOptions);
}
