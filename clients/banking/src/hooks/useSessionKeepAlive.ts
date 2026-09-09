import { getLocation } from "@swan-io/chicane";
import { badStatusToError, Request } from "@swan-io/request";
import { useEffect } from "react";
import { readLastActivity, writeLastActivity } from "../utils/lastActivity";
import { Router } from "../utils/routes";

const PING_INTERVAL = 30000; // 30s

const AUTO_SIGNOUT_INTERVAL = 300000; // 5min

const ping = () => {
  Request.make({ url: "/api/ping", method: "POST", credentials: "include", type: "text" });
};

const signout = () => {
  Request.make({ url: "/auth/logout", method: "POST", credentials: "include", type: "text" })
    .mapOkToResult(badStatusToError)
    .tapOk(() =>
      window.location.replace(
        Router.ProjectLogin({
          sessionExpired: "true",
          redirectTo: getLocation().toString(),
        }),
      ),
    );
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
      const now = Date.now();
      writeLastActivity(now);
    };

    const onInterval = () => {
      readLastActivity().match({
        Some: lastActivity => {
          const now = Date.now();
          if (now - lastActivity > AUTO_SIGNOUT_INTERVAL) {
            signout();
            return;
          }
          ping();
        },
        None: () => {
          signout();
        },
      });
    };

    const intervalId = setInterval(onInterval, PING_INTERVAL);
    onInterval();

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [enabled]);
};
