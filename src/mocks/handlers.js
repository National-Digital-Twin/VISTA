import { rest } from "msw";
import { mockAssessmentsResponse } from "./resolvers/assessments";

export const handlers = [
  rest.get('/assessments', mockAssessmentsResponse),
];
