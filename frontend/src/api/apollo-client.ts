import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import roadRoute from "./graphql-queries/roadRoute.graphql";
import SandbagPlacement from "./graphql-queries/sandbagPlacement.graphql";
import SandbagPlacements from "./graphql-queries/sandbagPlacements.graphql";
import createSandbagPlacement from "./graphql-queries/createSandbagPlacement.graphql";
import updateSandbagPlacement from "./graphql-queries/updateSandbagPlacement.graphql";
import deleteSandbagPlacement from "./graphql-queries/deleteSandbagPlacement.graphql";
import getLowBridges from "./graphql-queries/lowBridges.graphql";
import getVulnerablePeople from "./graphql-queries/vulnerablePeople.graphql";

import config from "@/config/app-config";

const PARALOG_PYTHON_BASE_URL = config.services.ndtpPython;

const httpLink = new HttpLink({ uri: PARALOG_PYTHON_BASE_URL });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export const GET_ROAD_ROUTE = roadRoute;
export const GET_SANDBAG_PLACEMENT = SandbagPlacement;
export const GET_SANDBAG_PLACEMENTS = SandbagPlacements;
export const CREATE_SANDBAG_PLACEMENT = createSandbagPlacement;
export const UPDATE_SANDBAG_PLACEMENT = updateSandbagPlacement;
export const DELETE_SANDBAG_PLACEMENT = deleteSandbagPlacement;
export const GET_LOW_BRIDGES = getLowBridges;
export const GET_VULNERABLE_PEOPLE = getVulnerablePeople;

export default client;
