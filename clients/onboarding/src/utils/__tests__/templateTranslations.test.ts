import { expect, test } from "vitest";
import { getRegistrationNumberLabel } from "../templateTranslations";

test("registration number label includes the local name when known", () => {
  expect(getRegistrationNumberLabel("FRA", "Company")).toBe("Registration number (SIREN)");
});

test("registration number label omits empty parentheses", () => {
  expect(getRegistrationNumberLabel("USA", "Company")).toBe("Registration number");
});
