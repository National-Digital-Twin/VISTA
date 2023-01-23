import { rest } from "msw";

import config from "config/app-config";
import {
  ASSESSMENTS_ASSETS_ENDPOINT,
  ASSESSMENTS_ASSET_TYPES_ENDPOINT,
  ASSESSMENTS_DEPENDENCIES_ENDPOINT,
  ASSESSMENTS_ENDPOINT,
  ONTOLOGY_CLASS_ENDPOINT,
} from "constants/endpoints";

import { assessments, assetTypes, ontologyClass, mockEmptyResponse, asset } from "./resolvers";

export const apiUrl = (path) => {
  const url = `${config.api.url}/${path}`;
  return url;
};

export const handlers = [
  rest.get(ASSESSMENTS_ENDPOINT, assessments),
  rest.get(apiUrl(ASSESSMENTS_ASSET_TYPES_ENDPOINT), assetTypes),
  rest.get(apiUrl(ONTOLOGY_CLASS_ENDPOINT), ontologyClass),
  rest.get(ASSESSMENTS_ASSETS_ENDPOINT, mockEmptyResponse),
  rest.get(ASSESSMENTS_DEPENDENCIES_ENDPOINT, mockEmptyResponse),
  rest.get(apiUrl("asset"), asset),
  rest.get(apiUrl("asset/dependents"), (req, res, ctx) => res(ctx.status(200), ctx.json([]))),
  rest.get(apiUrl("asset/providers"), (req, res, ctx) => res(ctx.status(200), ctx.json([]))),
];
