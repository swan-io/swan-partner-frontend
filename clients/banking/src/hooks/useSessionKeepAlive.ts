import { Request } from "@swan-io/request";
import { useEffect } from "react";

const PING_INTERVAL = 30000; // 30s

/**
 * Pings the server periodically to extend the session cookie TTL.
 *
 * Each `/api/*` call resets the `swan_session_id` cookie `maxAge`, so the ping
 * keeps the session alive as long as the page stays mounted.
 */
export const useSessionKeepAlive = () => {
  useEffect(() => {
    const ping = () => {
      Request.make({ url: "/api/ping", method: "POST", credentials: "include", type: "text" });
    };

    const intervalId = setInterval(ping, PING_INTERVAL);
    // Run the ping directly on mount
    ping();

    return () => clearInterval(intervalId);
  }, []);
};
