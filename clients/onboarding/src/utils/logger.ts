import posthog from "posthog-js";
import { env } from "./env";
import { sanitizeProperties } from "./redaction";

export const initPostHog = () => {
  if (import.meta.env.PROD && env.IS_SWAN_MODE) {
    const token =
      import.meta.env.DEV ||
      env.BANKING_URL.includes("master") ||
      env.BANKING_URL.includes("preprod")
        ? "phc_6u4uUv6Mp2a9mw7gOMEH8CiS4UEDlUHGuWlkz2OAYQe"
        : "phc_y7DlMezh1CgfrVIvkO2fkZMbJcbMziXCZvrPPWR2X8";

    posthog.init(token, {
      api_host: "https://eu.i.posthog.com",
      defaults: "2025-05-24",
      before_send: event => {
        if (event != null) {
          // PostHog attaches $current_url, $referrer and their $initial_, so scrub the whole property
          event.properties = sanitizeProperties(event.properties);
        }
        return event;
      },

      advanced_enable_surveys: false,
      enable_recording_console_log: false,
      disable_conversations: true,
      disable_external_dependency_loading: true,
      disable_persistence: true,
      disable_product_tours: true,
      disable_scroll_properties: true,
      disable_session_recording: true,
      disable_surveys: true,
      disable_surveys_automatic_display: true,
      disable_web_experiments: true,

      autocapture: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      capture_performance: false,
      capture_pageview: "history_change",
      capture_pageleave: true,
    });

    posthog.register({ application: "onboarding" });
  }
};

export const posthogLogger = {
  setContext: (context: Record<string, string>) => {
    posthog.register(context);
  },
  event: (name: string, properties?: Record<string, string>) => {
    posthog.capture(name, properties);
  },
};
