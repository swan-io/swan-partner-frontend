import "@swan-io/lake/src/assets/fonts/Inter.css";
import "@swan-io/lake/src/assets/main.css";

import { ResizeObserver } from "@juggle/resize-observer";
import "core-js/proposals/array-flat-map";
import "core-js/proposals/change-array-by-copy-stage-4";
import "core-js/proposals/object-from-entries";
import "core-js/proposals/promise-all-settled";
import "core-js/proposals/relative-indexing-method";
import "core-js/proposals/string-replace-all-stage-4";

// overrides shared-business supported languages
import "./utils/i18n";

import { Option } from "@swan-io/boxed";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { AppRegistry } from "react-native";
import { match } from "ts-pattern";
import { App } from "./App";
import { initSentry } from "./utils/logger";
import { projectConfiguration } from "./utils/projectId";

if (isNullish(window.ResizeObserver)) {
  window.ResizeObserver = ResizeObserver;
}

initSentry();

const rootTag = document.getElementById("app-root");

match(projectConfiguration)
  .with(Option.P.None, () => {
    const url = new URL(window.location.href);
    const [...envHostName] = url.hostname.split(".");
    url.hostname = ["partner", ...envHostName].join(".");
    if (!url.pathname.startsWith("/swanpopupcallback")) {
      url.pathname = "/";
    }
    // local dev tweak
    if (url.port === "8082") {
      url.port = "8080";
    }
    window.location.replace(url);
  })
  .otherwise(() => {
    if (rootTag != null) {
      AppRegistry.registerComponent("App", () => App);
      AppRegistry.runApplication("App", { rootTag });
    }
  });

console.log(
  `%c👋 Hey, looks like you're curious about how Swan works!
%c👀 Swan is looking for many curious people.

%c➡️ Feel free to check out https://www.welcometothejungle.com/fr/companies/swan/jobs, or send a message to join-us@swan.io`,
  "font-size: 1.125em; font-weight: bold;",
  "font-size: 1.125em;",
  "font-size: 1.125em;",
);
