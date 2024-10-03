import { QueryOptions, useLazyQuery } from "@apollo/client";
import { GET_VULNERABLE_PEOPLE } from "../apollo-client";

interface VulnerablePeopleInput {
  input: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
}

export interface VulnerablePeopleItem {
  mockIndividualIndex: string;
  mockFirstName: string;
  mockLastName: string;
  mockYearOfBirth: number;
  uprn: string;
  mockAscPrimarySupportReason: string;
  mockDisability: string;
  mockAlertCategory: string;
  mockAlertDetail: string;
  latitude: number;
  longitude: number;
}

interface VulnerablePeople {
  vulnerablePeople: VulnerablePeopleItem[];
}

export const useVulnerablePeopleLazyQuery = (
  options?: Omit<
    QueryOptions<VulnerablePeopleInput, VulnerablePeople>,
    "query"
  >,
) =>
  useLazyQuery<VulnerablePeople, VulnerablePeopleInput>(
    GET_VULNERABLE_PEOPLE,
    options,
  );
