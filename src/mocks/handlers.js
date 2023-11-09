import { rest } from "msw";
import {
  createParalogEndpoint,
  createOntologyEndpoint,
  fetchOptions,
} from "../api/utils";
import API from "../api";

import * as resolvers from "./resolvers";

export const handlers = [
  rest.get(createParalogEndpoint("assessments"), (req, res, ctx) =>
    res(ctx.json(resolvers.assessments))
  ),
  rest.get(createParalogEndpoint("assessments/asset-types"), (req, res, ctx) =>
    res(ctx.json(resolvers.assetTypes))
  ),
  rest.get(createParalogEndpoint("assessments/assets"), (req, res, ctx) =>
    res(ctx.json(resolvers.mockEmptyResponse))
  ),
  rest.get(createParalogEndpoint("assessments/dependencies"), (req, res, ctx) =>
    res(ctx.json(resolvers.mockEmptyResponse))
  ),
  rest.get(createParalogEndpoint("asset"), (req, res, ctx) =>
    res(ctx.json(resolvers.asset))
  ),
  rest.get(createParalogEndpoint("asset/dependents"), (req, res, ctx) =>
    res(ctx.json(resolvers.dependents))
  ),
  rest.get(createParalogEndpoint("asset/providers"), (req, res, ctx) =>
    res(ctx.json(resolvers.providers))
  ),
  rest.get(createParalogEndpoint("asset/residents"), (req, res, ctx) =>
    res(ctx.json(resolvers.residents))
  ),
  rest.get(createParalogEndpoint("flood-watch-areas"), (req, res, ctx) =>
    res(ctx.json(resolvers.allFloodAreas))
  ),
  rest.get(
    createParalogEndpoint("flood-watch-areas/polygon"),
    (req, res, ctx) => res(ctx.json(resolvers.floodAreaPolygons))
  ),
  rest.get(createParalogEndpoint("person/residences"), (req, res, ctx) =>
    res(ctx.json(resolvers.personResidences))
  ),
  rest.get(createParalogEndpoint("ontology/class"), (req, res, ctx) =>
    res(ctx.json(resolvers.ontologyClass))
  ),
  rest.get(createOntologyEndpoint("styles/class"), (req, res, ctx) =>
    res(ctx.json(resolvers.iconStyles))
  ),
];
