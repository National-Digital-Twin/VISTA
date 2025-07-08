import {
  MutationOptions,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  GET_SANDBAG_PLACEMENT,
  GET_SANDBAG_PLACEMENTS,
  CREATE_SANDBAG_PLACEMENT,
  UPDATE_SANDBAG_PLACEMENT,
  DELETE_SANDBAG_PLACEMENT,
} from "../apollo-client";

export interface SandbagPlacement {
  __typename: "SandbagPlacement";
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ValidationError {
  field: string;
  messages: string[];
}

export interface MutateSandbagPlacementResult {
  updateSandbagPlacement: {
    __typename: "MutateSandbagPlacementResult";
    sandbagPlacement: SandbagPlacement | null;
    errors: ValidationError[];
    success: boolean;
  };
}

export const useGetSandbagPlacement = (
  options?: MutationOptions<SandbagPlacement | null, { name: string }>,
) =>
  useQuery<SandbagPlacement | null, { name: string }>(
    GET_SANDBAG_PLACEMENT,
    options,
  );

export const useGetSandbagPlacements = (
  options?: MutationOptions<SandbagPlacement[]>,
) =>
  useLazyQuery<{ sandbagPlacements: SandbagPlacement[] }>(
    GET_SANDBAG_PLACEMENTS,
    options,
  );

export interface SandbagPlacementInput {
  input: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export const useCreateSandbagPlacement = (
  options?: MutationOptions<
    MutateSandbagPlacementResult,
    SandbagPlacementInput
  >,
) =>
  useMutation<MutateSandbagPlacementResult, SandbagPlacementInput>(
    CREATE_SANDBAG_PLACEMENT,
    { ...options, refetchQueries: [{ query: GET_SANDBAG_PLACEMENTS }] },
  );

export const useUpdateSandbagPlacement = (
  options?: MutationOptions<
    MutateSandbagPlacementResult,
    SandbagPlacementInput
  >,
) =>
  useMutation<MutateSandbagPlacementResult, SandbagPlacementInput>(
    UPDATE_SANDBAG_PLACEMENT,
    options,
  );

export const useDeleteSandbagPlacement = (
  options?: MutationOptions<MutateSandbagPlacementResult, { name: string }>,
) =>
  useMutation<MutateSandbagPlacementResult, { name: string }>(
    DELETE_SANDBAG_PLACEMENT,
    {
      ...options,
      refetchQueries: [{ query: GET_SANDBAG_PLACEMENTS }],
    },
  );
