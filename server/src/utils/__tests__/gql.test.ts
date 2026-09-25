import { describe, expect, it } from "vitest";
import { getCalledMutations } from "../gql";

describe("getCalledMutations", () => {
  it("returns the top-level field of a single mutation", () => {
    expect(getCalledMutations("mutation { updateAccount { id } }")).toEqual(["updateAccount"]);
  });

  it("returns every top-level field of a mutation", () => {
    expect(getCalledMutations("mutation { addCard { id } cancelCard { id } }")).toEqual([
      "addCard",
      "cancelCard",
    ]);
  });

  it("supports named mutation operations", () => {
    expect(getCalledMutations("mutation AddCard { addCard { id } }")).toEqual(["addCard"]);
  });

  it("combines fields across multiple mutation operations", () => {
    expect(getCalledMutations("mutation A { x { id } } mutation B { y { id } }")).toEqual([
      "x",
      "y",
    ]);
  });

  it("ignores query operations", () => {
    expect(getCalledMutations("query { account { id } }")).toEqual([]);
  });

  it("filters out __typename selections", () => {
    expect(getCalledMutations("mutation { __typename addCard { id } }")).toEqual(["addCard"]);
  });
});
