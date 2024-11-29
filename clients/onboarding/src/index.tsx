import "@swan-io/lake/src/assets/fonts/Inter.css";
import "@swan-io/lake/src/assets/main.css";
import "./main.css";

import { ResizeObserver } from "@juggle/resize-observer";
import "core-js/proposals/array-flat-map";
import "core-js/proposals/change-array-by-copy-stage-4";
import "core-js/proposals/object-from-entries";
import "core-js/proposals/promise-all-settled";
import "core-js/proposals/relative-indexing-method";
import "core-js/proposals/string-replace-all-stage-4";

// overrides shared-business supported languages
import "./utils/i18n";

import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { AppRegistry } from "react-native";
import { App } from "./App";
import { initSentry } from "./utils/logger";

initSentry();

if (isNullish(window.ResizeObserver)) {
  window.ResizeObserver = ResizeObserver;
}

const rootTag = document.getElementById("app-root");

if (rootTag != null) {
  AppRegistry.registerComponent("App", () => App);
  AppRegistry.runApplication("App", { rootTag });
}

console.log(
  `%c👋 Hey, looks like you're curious about how Swan works!
%c👀 Swan is looking for many curious people.

%c➡️ Feel free to check out https://www.welcometothejungle.com/fr/companies/swan/jobs, or send a message to join-us@swan.io`,
  "font-size: 1.125em; font-weight: bold;",
  "font-size: 1.125em;",
  "font-size: 1.125em;",
);
