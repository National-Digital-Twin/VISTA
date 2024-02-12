import { rest } from "msw";

import { createOntologyServiceEndpoint, createParalogEndpoint } from "api/combined";
import {
  ASSESSMENTS_ASSETS_ENDPOINT,
  ASSESSMENTS_DEPENDENCIES_ENDPOINT,
} from "constants/endpoints";

import * as resolvers from "./resolvers";

export const handlers = [
  rest.get(createParalogEndpoint("assessments"), resolvers.assessments),
  rest.get(createParalogEndpoint("assessments/asset-types"), resolvers.assetTypes),
  rest.get(ASSESSMENTS_ASSETS_ENDPOINT, resolvers.mockEmptyResponse),
  rest.get(ASSESSMENTS_DEPENDENCIES_ENDPOINT, resolvers.mockEmptyResponse),
  rest.get(createParalogEndpoint("asset"), resolvers.asset),
  rest.get(createParalogEndpoint("asset/dependents"), resolvers.dependents),
  rest.get(createParalogEndpoint("asset/providers"), resolvers.providers),
  rest.get(createParalogEndpoint("asset/residents"), resolvers.residents),
  rest.get(createParalogEndpoint("flood-watch-areas"), resolvers.allFloodAreas),
  rest.get(createParalogEndpoint("flood-watch-areas/polygon"), resolvers.floodAreaPolygons),
  rest.get(createParalogEndpoint("person/residences"), resolvers.personResidences),
  rest.get(createParalogEndpoint("ontology/class"), resolvers.ontologyClass),
  rest.get(createOntologyServiceEndpoint("ontology/query"), resolvers.ontologyStyles),
];
