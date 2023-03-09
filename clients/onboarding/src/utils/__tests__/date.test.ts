import { expect, test } from "vitest";
import { isValidBirthDate } from "../date";

test("isValidBirthDate", () => {
  expect(isValidBirthDate("123123")).toBe(false);
  expect(isValidBirthDate("01/01/2000")).toBe(true);
});
