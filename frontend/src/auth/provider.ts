import config from "@/config/app-config";

/** Provider of authentication */
export interface AuthProvider {
  /** As a custom hook, who is the current account (if any)? */
  getCurrentAccount: () => AccountInfo | null;

  /** Subscribe to auth changes */
  subscribe: (handler: () => void) => () => void;

  /** What bearer token do we attach to fetch requests? */
  bearerToken: () => string | null;

  /** Log in - auth error message if no good, null if successful */
  logIn: (key: string) => Promise<string | null>;

  /** Log out */
  logOut: () => Promise<void>;
}

/** Account info */
export interface AccountInfo {
  /** Avatar URI (if relevant) */
  avatar?: string;
  /** Display name */
  name: string;
}

/** Dummy authenticator (relevant for local development) */
class DummyAuthProvider implements AuthProvider {
  readonly #account: AccountInfo | null;

  constructor(account: AccountInfo | null) {
    this.#account = account;
  }

  getCurrentAccount() {
    return this.#account;
  }

  subscribe(_handler: () => void) {
    // State can never change, so this is a no-op
    return () => undefined;
  }

  bearerToken() {
    return null;
  }

  logIn(_key: string) {
    const isLoggedIn = !!this.#account;
    return new Promise<string | null>((resolve) => {
      setTimeout(() => {
        if (isLoggedIn) {
          resolve(null);
        } else {
          resolve("Key not valid");
        }
      }, 3000);
    });
  }

  async logOut() {
    if (this.#account === null) {
      // Idempotent
      return;
    }
    // Not meaningful
    throw new Error("Cannot log out from dummy authentication");
  }
}

class KeyAuthProvider implements AuthProvider {
  #bearerToken: string | null = null;
  readonly #observers: Set<() => void> = new Set();
  readonly #testURI: string;
  readonly #accountInfo: AccountInfo | null = null;

  constructor(testURI: string) {
    this.#testURI = testURI;
  }

  getCurrentAccount() {
    return this.#accountInfo;
  }

  #notifyObservers() {
    this.#observers.forEach((observer) => observer());
  }

  subscribe(handler: () => void) {
    this.#observers.add(handler);
    return () => {
      this.#observers.delete(handler);
    };
  }

  bearerToken() {
    return this.#bearerToken;
  }

  async logIn(key: string) {
    const response = await fetch(this.#testURI, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      this.#bearerToken = key;
      this.#accountInfo = {
        name: "Demo user",
      };
      return null;
    } else if (response.status === 401 || response.status === 403) {
      return "Key not recognised";
    } else {
      throw new Error(`Authentication failed: ${response.status}`);
    }
  }

  async logOut() {
    if (this.#bearerToken) {
      this.#bearerToken = null;
      this.#accountInfo = null;
      this.#notifyObservers();
    }
  }
}

export default config.auth.url
  ? new KeyAuthProvider(config.auth.url)
  : new DummyAuthProvider({ name: "Development user" });
// export default new DummyAuthProvider(null) as AuthProvider;
