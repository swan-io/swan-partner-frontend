import { expect, test } from "vitest";
import { locale } from "../i18n";
import { getRegistrationNumberLabel } from "../templateTranslations";

test("registration number label includes the local name when known", () => {
  expect(getRegistrationNumberLabel("FRA", "Company", locale.language)).toBe(
    "Registration number (SIREN)",
  );
});

test("registration number label omits empty parentheses", () => {
  expect(getRegistrationNumberLabel("USA", "Company", locale.language)).toBe("Registration number");
});
