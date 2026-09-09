import { Option, Result } from "@swan-io/boxed";

// Stored in `localStorage` so it is shared between tabs: an idle tab shouldn't
// consider the session inactive while the user works in another one
const LAST_ACTIVITY_KEY = "swan_last_activity";

export const readLastActivity = (): Option<number> =>
  Result.fromExecution(() => localStorage.getItem(LAST_ACTIVITY_KEY))
    .toOption()
    .flatMap(Option.fromNullable)
    .map(Number)
    .filter(Number.isFinite);

export const writeLastActivity = (timestamp: number): void => {
  // `localStorage` throws when site data is blocked, we can safely ignore it
  Result.fromExecution(() => localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp)));
};

export const clearLastActivity = (): void => {
  Result.fromExecution(() => localStorage.removeItem(LAST_ACTIVITY_KEY));
};
