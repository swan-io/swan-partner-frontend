import { describe, expect, it } from "vitest";
import { isSearchTooShort, toSearchFilter, toSearchQuery } from "../search";

describe("toSearchQuery", () => {
  it("returns an empty string for an empty value", () => {
    expect(toSearchQuery("")).toBe("");
  });

  it("returns an empty string below 3 characters", () => {
    expect(toSearchQuery("a")).toBe("");
    expect(toSearchQuery("ab")).toBe("");
  });

  it("ignores surrounding whitespace when checking the length", () => {
    expect(toSearchQuery("   ")).toBe("");
    expect(toSearchQuery("  ab  ")).toBe("");
  });

  it("returns the trimmed value from 3 characters", () => {
    expect(toSearchQuery("abc")).toBe("abc");
    expect(toSearchQuery("  abc  ")).toBe("abc");
    expect(toSearchQuery(" john doe ")).toBe("john doe");
  });
});

describe("isSearchTooShort", () => {
  it("is false for an empty or blank value", () => {
    expect(isSearchTooShort("")).toBe(false);
    expect(isSearchTooShort("   ")).toBe(false);
  });

  it("is true for 1 or 2 characters, trimmed", () => {
    expect(isSearchTooShort("a")).toBe(true);
    expect(isSearchTooShort(" ab ")).toBe(true);
  });

  it("is false from 3 characters", () => {
    expect(isSearchTooShort("abc")).toBe(false);
    expect(isSearchTooShort("  abc  ")).toBe(false);
  });
});

describe("toSearchFilter", () => {
  it("is undefined for a missing, empty or blank value", () => {
    expect(toSearchFilter(undefined)).toBeUndefined();
    expect(toSearchFilter("")).toBeUndefined();
    expect(toSearchFilter("   ")).toBeUndefined();
  });

  it("is undefined below 3 characters, trimmed", () => {
    expect(toSearchFilter("ab")).toBeUndefined();
    expect(toSearchFilter("  ab  ")).toBeUndefined();
  });

  it("is the trimmed value from 3 characters", () => {
    expect(toSearchFilter("  abc  ")).toBe("abc");
  });
});
