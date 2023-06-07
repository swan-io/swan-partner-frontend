import { resolveAfter, seconds } from "./functions";

class RetryTimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, RetryTimeoutError.prototype);
    this.name = this.constructor.name;
  }
}

export type RetryConfig = {
  maxAttempts?: number;
  delay?: number;
  onFailedAttempt?: () => Promise<unknown> | unknown;
};

export const retry = <T>(
  getPromise: () => Promise<T>,
  { delay = seconds(2), maxAttempts = 30, onFailedAttempt }: RetryConfig = {},
): Promise<T> => {
  const safeMaxAttempts = Math.max(maxAttempts, 1);

  return getPromise().catch(async (error: unknown) => {
    if (safeMaxAttempts <= 1) {
      return Promise.reject(error);
    }

    if (onFailedAttempt != null) {
      try {
        await onFailedAttempt();
      } catch (_error) {} // eslint-disable-line no-empty
    }

    return resolveAfter(error instanceof RetryTimeoutError ? 0 : delay).then(() =>
      retry(getPromise, { maxAttempts: safeMaxAttempts - 1, delay, onFailedAttempt }),
    );
  });
};
