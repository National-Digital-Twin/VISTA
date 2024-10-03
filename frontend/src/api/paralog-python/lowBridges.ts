import client, { GET_LOW_BRIDGES } from "../apollo-client";

export interface LowBridge {
  localId: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const fetchLowBridges = async (): Promise<LowBridge[]> => {
  const { data, errors } = await client.query({
    query: GET_LOW_BRIDGES,
  });

  if (errors) {
    throw new Error(
      `An error occurred: ${errors.map((error) => error.message).join(", ")}`,
    );
  }

  return data.lowBridges;
};
