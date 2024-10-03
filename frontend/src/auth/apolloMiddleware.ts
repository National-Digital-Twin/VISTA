import { ApolloLink } from "@apollo/client";
import provider from "./provider";

function getBearerToken(): string | null {
  return provider.bearerToken();
}

export default new ApolloLink((operation, forward) => {
  // Add authorization to the headers
  const token = getBearerToken();

  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }));
  }

  return forward(operation);
});
