import { rest } from "msw";
import { assessments, assets, connections } from "./resolvers";

export const handlers = [
  rest.get('/assessments', assessments),
  rest.get('/assessments/assets', assets),
  rest.get('/assessments/connections', connections),
];
