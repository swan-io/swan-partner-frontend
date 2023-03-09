import "@swan-io/lake/src/assets/fonts/Inter.css";
import "@swan-io/lake/src/assets/main.css";

import { ResizeObserver } from "@juggle/resize-observer";
import "core-js/actual/array/flat";

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
