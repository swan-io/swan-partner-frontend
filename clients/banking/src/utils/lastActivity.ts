import { Option, Result } from "@swan-io/boxed";

// Stored in `localStorage` so it is shared between tabs: an idle tab shouldn't
// consider the session inactive while the user works in another one
export const LAST_ACTIVITY_KEY = "swan_last_activity";

let lastActivityStorageFallback: string | null = null;

export const readLastActivity = (): Option<number> => {
  return Result.fromExecution(() => localStorage.getItem(LAST_ACTIVITY_KEY))
    .flatMapError(() => Result.Ok(lastActivityStorageFallback))
    .toOption()
    .flatMap(value => Option.fromNullable(value))
    .map(Number)
    .filter(Number.isFinite);
};

export const writeLastActivity = (timestamp: number): void => {
  const value = String(timestamp);
  // `localStorage` throws when site data is blocked, we can safely ignore it
  Result.fromExecution(() => localStorage.setItem(LAST_ACTIVITY_KEY, value));
  lastActivityStorageFallback = value;
};

export const clearLastActivity = (): void => {
  Result.fromExecution(() => localStorage.removeItem(LAST_ACTIVITY_KEY));
  lastActivityStorageFallback = null;
};
