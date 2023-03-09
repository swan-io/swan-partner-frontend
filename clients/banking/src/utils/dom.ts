import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { logFrontendError } from "./logger";

export const querySafeSelector = (selector: string) => {
  const element: HTMLElement | null = document.querySelector(selector);

  if (isNotNullish(element)) {
    return element;
  }

  logFrontendError(new Error(`"${selector}" selector query returns no element`));
  return document.createElement("div");
};
