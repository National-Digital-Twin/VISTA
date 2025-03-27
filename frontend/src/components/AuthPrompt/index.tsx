import { useCallback, useId } from "react";
import type { SyntheticEvent } from "react";
import classNames from "classnames";
import styles from "./style.module.css";

export interface AuthPromptProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
  /** Error from the last login, if any */
  readonly error?: string;
  /** How to perform a login. If missing, this is disabled */
  readonly onLogIn?: (key: string) => void;
}

/** Top-level authentication prompt */
export default function AuthPrompt({
  className,
  error,
  onLogIn,
}: AuthPromptProps) {
  const keyId = useId();

  const onSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (onLogIn) {
        const form = event.currentTarget;
        const keyInput = form.elements.namedItem("key") as HTMLInputElement;
        onLogIn(keyInput.value);
      }
    },
    [onLogIn],
  );

  console.log(onLogIn);

  return (
    <div className={classNames(styles.authPromptContainer, className)}>
      <div className={styles.authPrompt}>
        <h2 className={styles.title}>Enter authentication key</h2>
        <form className={styles.authForm} onSubmit={onSubmit}>
          <p className={styles.error}>{error ?? " "}</p>
          <label className="sr-only" htmlFor={keyId}>
            Authentication Key
          </label>
          <input
            id={keyId}
            className="form-control"
            type="text"
            name="key"
            autoCapitalize="characters"
            required
            minLength={19}
            maxLength={19}
            pattern="\w{4}-\w{4}-\w{4}-\w{4}"
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
          <button className="btn" type="submit" disabled={!onLogIn}>
            {onLogIn ? "Log In" : "..."}
          </button>
        </form>
      </div>
    </div>
  );
}
