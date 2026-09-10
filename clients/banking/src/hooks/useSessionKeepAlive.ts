import { getLocation } from "@swan-io/chicane";
import { badStatusToError, Request } from "@swan-io/request";
import { useEffect } from "react";
import {
  clearLastActivity,
  LAST_ACTIVITY_KEY,
  readLastActivity,
  writeLastActivity,
} from "../utils/lastActivity";
import { Router } from "../utils/routes";

const PING_INTERVAL = 30000; // 30s

// Mirrors `COOKIE_MAX_AGE` in `server/src/app.ts`
// const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5min
const INACTIVITY_LIMIT = 1 * 60 * 1000; // 1min

const ping = () => {
  Request.make({ url: "/api/ping", method: "POST", credentials: "include", type: "text" });
};

const signout = () => {
  Request.make({ url: "/auth/logout", method: "POST", credentials: "include", type: "text" })
    .mapOkToResult(badStatusToError)
    .tapOk(() => {
      clearLastActivity();
      window.location.replace(
        Router.ProjectLogin({ sessionExpired: "true", redirectTo: getLocation().toString() }),
      );
    });
};

/**
 * Pings the server periodically to extend the session cookie TTL.
 *
 * Each `/api/*` call resets the `swan_session_id` cookie `maxAge`, so the ping
 * keeps the session alive as long as `enabled` stays true.
 */
export const useSessionKeepAlive = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleActivity = () => {
      writeLastActivity(Date.now());
    };

    const onInterval = () => {
      const now = Date.now();
      readLastActivity().match({
        Some: lastActivity => {
          if (now - lastActivity > INACTIVITY_LIMIT) {
            signout();
          } else {
            ping();
          }
        },
        // This could happen only if another tab logged out and cleared the last activity timestamp
        // Before last activity is set before the interval is started
        None: () => {},
      });
    };

    const onStorageChange = (event: StorageEvent) => {
      // if last activity key is removed from localStorage, it means another tab logged out
      if (event.key === LAST_ACTIVITY_KEY && event.newValue == null) {
        window.location.replace(
          Router.ProjectLogin({ sessionExpired: "true", redirectTo: getLocation().toString() }),
        );
      }
    };

    handleActivity(); // Initialize "last activity" timestamp on mount
    const intervalId = setInterval(onInterval, PING_INTERVAL);
    onInterval();

    window.addEventListener("storage", onStorageChange);
    window.addEventListener("pointerdown", handleActivity, { capture: true, passive: true });
    window.addEventListener("keydown", handleActivity, { capture: true, passive: true });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("pointerdown", handleActivity, { capture: true });
      window.removeEventListener("keydown", handleActivity, { capture: true });
    };
  }, [enabled]);
};
