import { rest } from "msw";
import {
  ASSESSMENTS_ASSETS_ENDPOINT,
  ASSESSMENTS_ASSET_TYPES_ENDPOINT,
  ASSESSMENTS_DEPENDENCIES_ENDPOINT,
  ASSESSMENTS_ENDPOINT,
  ONTOLOGY_CLASS_ENDPOINT,
} from "constants/endpoints";
import { assessments, assetTypes, ontologyClass, mockEmptyResponse } from "./resolvers";

export const handlers = [
  rest.get(ASSESSMENTS_ENDPOINT, assessments),
  rest.get(ASSESSMENTS_ASSET_TYPES_ENDPOINT, assetTypes),
  rest.get(ONTOLOGY_CLASS_ENDPOINT, ontologyClass),
  rest.get(ASSESSMENTS_ASSETS_ENDPOINT, mockEmptyResponse),
  rest.get(ASSESSMENTS_DEPENDENCIES_ENDPOINT, mockEmptyResponse),
];
