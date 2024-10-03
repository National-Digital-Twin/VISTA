import { useCallback, useDebugValue } from "react";
import { useMutation } from "@tanstack/react-query";
import provider from "./provider";
import useCurrentAccount from "./useCurrentAccount";
import type { AccountInfo } from "./provider";

interface UseAuthenticateResultLoggedIn {
  status: "logged-in";
  account: AccountInfo;
  onLogOut: () => void;
}

interface UseAuthenticateResultLoggingIn {
  status: "logging-in";
}

interface UseAuthenticateResultLoggedOut {
  status: "logged-out";
  error?: string;
  onLogIn: (key: string) => void;
}

type UseAuthenticateResult =
  | UseAuthenticateResultLoggedIn
  | UseAuthenticateResultLoggingIn
  | UseAuthenticateResultLoggedOut;

function formatResponseDebug(result: UseAuthenticateResult) {
  if (result.status === "logged-in") {
    return `LOGGED IN: ${result.account.name}`;
  } else if (result.status === "logging-in") {
    return "LOGGING IN";
  } else if (result.status === "logged-out") {
    if (result.error) {
      return `LOGGED OUT: ${result.error}`;
    } else {
      return "LOGGED OUT";
    }
  } else {
    throw new Error("Unknown status");
  }
}

export default function useAuthenticate(): UseAuthenticateResult {
  const currentAccount = useCurrentAccount();
  const {
    data: logInResponse,
    isError,
    error,
    isPending,
    mutate,
  } = useMutation({
    mutationFn: async (key: string) => {
      return await provider.logIn(key);
    },
  });

  // Log out we can reasonably assume works
  const logOut = useCallback(() => {
    provider.logOut();
  }, []);

  let response: UseAuthenticateResult;

  if (currentAccount) {
    response = {
      status: "logged-in",
      account: currentAccount,
      onLogOut: logOut,
    };
  } else if (isPending) {
    response = {
      status: "logging-in",
    };
  } else {
    response = {
      status: "logged-out",
      error: logInResponse || (isError ? error.message : undefined),
      onLogIn: mutate,
    };
  }

  useDebugValue(response, formatResponseDebug);

  return response;
}
